import fs from "fs/promises";
import crypto from "crypto";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { pool } from "./src/db/database";

dotenv.config();

const PRIVATE_KEY_PATH = path.join(
  process.cwd(),
  "keys",
  "modelguard-private.pem"
);

async function createRSA3072PSSSignature(
  data: string
): Promise<string> {
  const privateKey = await fs.readFile(
    PRIVATE_KEY_PATH,
    "utf8"
  );

  const signer = crypto.createSign("sha256");
  signer.update(data, "utf8");
  signer.end();

  return signer.sign(
    {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
      saltLength: 32,
    },
    "hex"
  );
}

const app = express();
const PORT = 5000;

// ============================================================
// PROTOTYPE KEY STORE
// ============================================================

const encryptionKeyStore = new Map<
  string,
  {
    keyHex: string;
    ivHex: string;
    authTagHex: string;
    encryptedPayloadHex: string;
    packageHash: string;
    createdAt: number;
  }
>();

app.use(express.json({ limit: "50mb" }));

// ============================================================
// GEMINI CLIENT
// ============================================================

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }

  return new GoogleGenAI({ apiKey });
}

// ============================================================
// MODEL ENCRYPTION
// ============================================================

function encryptModelBuffer(modelBuffer: Buffer) {
  const key = crypto.randomBytes(32);
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv(
    "aes-256-gcm",
    key,
    iv
  );

  const encrypted = Buffer.concat([
    cipher.update(modelBuffer),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  const packageHash = crypto
    .createHash("sha256")
    .update(encrypted)
    .digest("hex");

  return {
    encryptedPayloadHex: encrypted.toString("hex"),
    keyHex: key.toString("hex"),
    ivHex: iv.toString("hex"),
    authTagHex: authTag.toString("hex"),
    packageHash,
    originalSizeBytes: modelBuffer.length,
    encryptedSizeBytes: encrypted.length,
  };
}

// ============================================================
// DATABASE TEST
// ============================================================

app.get("/api/db-test", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT NOW() AS current_time"
    );

    res.json({
      connected: true,
      database: "tfrenzy_modelguard",
      time: result.rows[0].current_time,
    });
  } catch (error: any) {
    console.error("Database test failed:", error);

    res.status(500).json({
      connected: false,
      error: error.message,
    });
  }
});

// ============================================================
// DEVICES
// ============================================================

app.get("/api/devices", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        name,
        serial_number,
        mac_address,
        ip_address,
        status,
        registered_at,
        last_seen_at,
        location
      FROM devices
      ORDER BY registered_at DESC
    `);

    res.json({
      success: true,
      count: result.rows.length,
      devices: result.rows,
    });
  } catch (error: any) {
    console.error("Failed to fetch devices:", error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.post("/api/devices", async (req, res) => {
  try {
    const {
      id,
      name,
      serialNumber,
      macAddress,
      ipAddress,
      deviceCertFingerprint,
      certIssuer,
      certExpiresAt,
      publicKey,
      hardwareFuseHash,
      jetpackVersion,
      cudaVersion,
      status,
      location,
      assignedModelIds,
    } = req.body;

    if (
      !id ||
      !name ||
      !serialNumber ||
      !macAddress ||
      !ipAddress ||
      !deviceCertFingerprint ||
      !certIssuer ||
      !certExpiresAt ||
      !publicKey ||
      !hardwareFuseHash ||
      !jetpackVersion ||
      !cudaVersion ||
      !location
    ) {
      return res.status(400).json({
        success: false,
        error: "Missing required device fields",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO devices (
        id,
        name,
        serial_number,
        mac_address,
        ip_address,
        device_cert_fingerprint,
        cert_issuer,
        cert_expires_at,
        public_key,
        hardware_fuse_hash,
        jetpack_version,
        cuda_version,
        status,
        location,
        assigned_model_ids
      )
      VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15
      )
      RETURNING *
      `,
      [
        id,
        name,
        serialNumber,
        macAddress,
        ipAddress,
        deviceCertFingerprint,
        certIssuer,
        certExpiresAt,
        publicKey,
        hardwareFuseHash,
        jetpackVersion,
        cudaVersion,
        status || "pending",
        location,
        assignedModelIds || [],
      ]
    );

    res.status(201).json({
      success: true,
      device: result.rows[0],
    });
  } catch (error: any) {
    console.error("Failed to create device:", error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================
// MODELS
// ============================================================

app.get("/api/models", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        name,
        version,
        original_file_name,
        original_size_bytes,
        encrypted_size_bytes,
        trt_version,
        architecture,
        package_hash,
        signature,
        signing_key_id,
        encryption_algo,
        signature_algo,
        created_at,
        created_by,
        status,
        input_shape,
        precision,
        revoked_at,
        revocation_reason
      FROM models
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      count: result.rows.length,
      models: result.rows,
    });
  } catch (error: any) {
    console.error("Models fetch failed:", error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.post("/api/models", async (req, res) => {
  try {
    const {
      id,
      name,
      version,
      originalFileName,
      originalSizeBytes,
      encryptedSizeBytes,
      trtVersion,
      architecture,
      packageHash,
      signature,
      signingKeyId,
      encryptionAlgo,
      signatureAlgo,
      createdBy,
      inputShape,
      precision,
    } = req.body;

    const result = await pool.query(
      `
      INSERT INTO models (
        id,
        name,
        version,
        original_file_name,
        original_size_bytes,
        encrypted_size_bytes,
        trt_version,
        architecture,
        package_hash,
        signature,
        signing_key_id,
        encryption_algo,
        signature_algo,
        created_by,
        input_shape,
        precision
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
        $11,$12,$13,$14,$15,$16
      )
      RETURNING *
      `,
      [
        id,
        name,
        version,
        originalFileName,
        originalSizeBytes,
        encryptedSizeBytes,
        trtVersion,
        architecture,
        packageHash,
        signature,
        signingKeyId,
        encryptionAlgo || "AES-256-GCM",
        signatureAlgo || "RSA-3072-PSS",
        createdBy,
        inputShape,
        precision,
      ]
    );

    res.status(201).json({
      success: true,
      model: result.rows[0],
    });
  } catch (error: any) {
    console.error("Model insert failed:", error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================
// MODEL VERSIONS
// ============================================================

app.get("/api/model-versions", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        model_id,
        version,
        package_hash,
        created_at,
        status
      FROM model_versions
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      count: result.rows.length,
      versions: result.rows,
    });
  } catch (error: any) {
    console.error("Model versions fetch failed:", error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.post("/api/model-versions", async (req, res) => {
  try {
    const {
      id,
      modelId,
      version,
      packageHash,
      status,
    } = req.body;

    if (!id || !modelId || !version || !packageHash) {
      return res.status(400).json({
        success: false,
        error: "Missing required model version fields",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO model_versions (
        id,
        model_id,
        version,
        package_hash,
        status
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [
        id,
        modelId,
        version,
        packageHash,
        status || "active",
      ]
    );

    res.status(201).json({
      success: true,
      version: result.rows[0],
    });
  } catch (error: any) {
    console.error("Model version insert failed:", error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================
// SHA-256 HASH
// ============================================================

app.post("/api/security/hash", (req, res) => {
  try {
    const { payload } = req.body;

    if (payload === undefined || payload === null) {
      return res.status(400).json({
        success: false,
        error: "payload is required",
      });
    }

    const payloadString =
      typeof payload === "string"
        ? payload
        : JSON.stringify(payload);

    const hash = crypto
      .createHash("sha256")
      .update(payloadString, "utf8")
      .digest("hex");

    res.json({
      success: true,
      algorithm: "SHA-256",
      hash,
    });
  } catch (error: any) {
    console.error("SHA-256 hash generation failed:", error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================
// MODEL PACKAGES
// ============================================================

app.post(
  "/api/model-packages/encrypt-test",
  async (req, res) => {
    const client = await pool.connect();

    try {
      const {
        fileName,
        fileBase64,
        modelName,
        modelVersion,
        trtVersion,
        architecture,
        inputShape,
        precision,
        createdBy,
      } = req.body;

      if (
        !fileName ||
        !fileBase64 ||
        !modelName ||
        !modelVersion
      ) {
        return res.status(400).json({
          success: false,
          error:
            "fileName, fileBase64, modelName and modelVersion are required",
        });
      }

      if (
        !String(fileName)
          .toLowerCase()
          .endsWith(".engine")
      ) {
        return res.status(400).json({
          success: false,
          error:
            "Only TensorRT .engine files are accepted",
        });
      }

      const cleanBase64 = String(fileBase64).replace(
        /^data:.*?;base64,/,
        ""
      );

      const modelBuffer = Buffer.from(
        cleanBase64,
        "base64"
      );

      if (modelBuffer.length === 0) {
        return res.status(400).json({
          success: false,
          error:
            "Uploaded model file is empty",
        });
      }

      // 1. SHA-256 of the actual uploaded .engine
      const originalModelHash = crypto
        .createHash("sha256")
        .update(modelBuffer)
        .digest("hex");

      // 2. Real AES-256-GCM encryption
      const result = encryptModelBuffer(modelBuffer);

      // 3. Keep encryption material only in server memory
      encryptionKeyStore.set(
        result.packageHash,
        {
          keyHex: result.keyHex,
          ivHex: result.ivHex,
          authTagHex: result.authTagHex,
          encryptedPayloadHex:
            result.encryptedPayloadHex,
          packageHash: result.packageHash,
          createdAt: Date.now(),
        }
      );

      // 4. Manifest
     const modelId =
  `MOD-${crypto.randomUUID()}`;

const manifest = {
  tfrenzy_manifest_version: "2.0.0",

  model_id: modelId,

  model_name: String(modelName),

  version: String(modelVersion),

  original_engine: String(fileName),

  original_model_sha256:
    originalModelHash,

  target_hardware:
    architecture ||
    "NVIDIA Jetson Orin Nano",

  tensorrt_version:
    trtVersion ||
    "TensorRT 8.5.2",

  encryption: {
    algorithm: "AES-256-GCM",

    key_derivation:
      "random-256-bit-server-memory-key",

    iv_size_bits: 96,

    auth_tag_size_bits: 128,
  },

  signature: {
    algorithm: "RSA-3072-PSS",

    signing_key_id:
      "TF-RSA3072-ROOT-KEY-2026-PRIMARY",
  },

  hashes: {
    package_sha256:
      result.packageHash,
  },

  input_shape:
    inputShape ||
    "1x3x640x640",

  precision:
    precision ||
    "FP16",

  created_at:
    new Date().toISOString(),

  created_by:
    createdBy ||
    "Model Packaging Service",
};

const manifestString =
  JSON.stringify(manifest);
const manifestSignature =
  await createRSA3072PSSSignature(
    manifestString
  );

// 6. Unique database IDs
const versionId =
  `VER-${crypto.randomUUID()}`;

const packageId =
  `PKG-${crypto.randomUUID()}`;

      // 7. Store model + version + encrypted package
      await client.query("BEGIN");

      await client.query(
        `
        INSERT INTO models (
          id,
          name,
          version,
          original_file_name,
          original_size_bytes,
          encrypted_size_bytes,
          trt_version,
          architecture,
          package_hash,
          signature,
          signing_key_id,
          encryption_algo,
          signature_algo,
          created_by,
          status,
          input_shape,
          precision
        )
        VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11,
          $12, $13, $14, $15, $16, $17
        )
        `,
        [
          modelId,
          modelName,
          modelVersion,
          fileName,
          result.originalSizeBytes,
          result.encryptedSizeBytes,
          trtVersion ||
            "TensorRT 8.5.2",
          architecture ||
            "NVIDIA Jetson Orin Nano",
          result.packageHash,
          manifestSignature,
          "TF-RSA3072-ROOT-KEY-2026-PRIMARY",
          "AES-256-GCM",
          "RSA-3072-PSS",
          createdBy ||
            "Model Packaging Service",
          "active",
          inputShape ||
            "1x3x640x640",
          precision || "FP16",
        ]
      );

      await client.query(
        `
        INSERT INTO model_versions (
          id,
          model_id,
          version,
          package_hash,
          status
        )
        VALUES ($1, $2, $3, $4, $5)
        `,
        [
          versionId,
          modelId,
          modelVersion,
          result.packageHash,
          "active",
        ]
      );

      await client.query(
        `
        INSERT INTO model_packages (
          id,
          version_id,
          encrypted_payload_hex,
          manifest_json,
          manifest_sig_hex,
          status
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [
          packageId,
          versionId,
          result.encryptedPayloadHex,
          manifestString,
          manifestSignature,
          "active",
        ]
      );

      await client.query("COMMIT");

      res.status(201).json({
        success: true,
        message:
          "TensorRT model encrypted, signed and stored successfully",
        modelId,
        versionId,
        packageId,
        file: fileName,
        algorithm: "AES-256-GCM",
        signatureAlgorithm:
          "RSA-3072-PSS",
        originalModelHash,
        packageHash:
          result.packageHash,
        originalSizeBytes:
          result.originalSizeBytes,
        encryptedSizeBytes:
          result.encryptedSizeBytes,
        manifest,
        manifestSignature,
        keyStoredInMemory: true,
        keyStoredInDatabase: false,
        plaintextStoredInDatabase: false,
      });

      // Clear the plaintext buffer after encryption.
      modelBuffer.fill(0);
    } catch (error: any) {
      try {
        await client.query("ROLLBACK");
      } catch {
        // Ignore rollback errors.
      }

      console.error(
        "Model packaging failed:",
        error
      );

      res.status(500).json({
        success: false,
        error:
          error.message ||
          "Model packaging failed",
      });
    } finally {
      client.release();
    }
  }
);app.get(
  "/api/model-packages",
  async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT
          id,
          version_id,
          encrypted_payload_hex,
          manifest_json,
          manifest_sig_hex,
          status,
          created_at
        FROM model_packages
        ORDER BY created_at DESC
      `);

      res.json({
        success: true,
        count: result.rows.length,
        packages: result.rows,
      });
    } catch (error: any) {
      console.error(
        "Model packages fetch failed:",
        error
      );

      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

app.post(
  "/api/model-packages",
  async (req, res) => {
    try {
      const {
        id,
        versionId,
        encryptedPayloadHex,
        manifestJson,
        manifestSigHex,
        status,
      } = req.body;

      if (
        !id ||
        !versionId ||
        !encryptedPayloadHex ||
        !manifestJson ||
        !manifestSigHex
      ) {
        return res.status(400).json({
          success: false,
          error:
            "Missing required model package fields",
        });
      }

      const result = await pool.query(
        `
        INSERT INTO model_packages (
          id,
          version_id,
          encrypted_payload_hex,
          manifest_json,
          manifest_sig_hex,
          status
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
        `,
        [
          id,
          versionId,
          encryptedPayloadHex,
          typeof manifestJson === "string"
            ? manifestJson
            : JSON.stringify(manifestJson),
          manifestSigHex,
          status || "active",
        ]
      );

      res.status(201).json({
        success: true,
        package: result.rows[0],
      });
    } catch (error: any) {
      console.error(
        "Model package insert failed:",
        error
      );

      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// ============================================================
// DEPLOYMENTS
// ============================================================

app.get(
  "/api/deployments",
  async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT
          id,
          model_id,
          device_id,
          model_name,
          model_version,
          device_name,
          device_serial,
          created_at,
          expires_at,
          status,
          max_offline_days,
          nonce_interval_seconds,
          license_key,
          active_nonces_used,
          revoked_at,
          revoked_reason
        FROM deployments
        ORDER BY created_at DESC
      `);

      res.json({
        success: true,
        count: result.rows.length,
        deployments: result.rows,
      });
    } catch (error: any) {
      console.error(
        "Deployments fetch failed:",
        error
      );

      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

app.post(
  "/api/deployments",
  async (req, res) => {
    try {
      const {
        id,
        modelId,
        deviceId,
        modelName,
        modelVersion,
        deviceName,
        deviceSerial,
        expiresAt,
        status,
        maxOfflineDays,
        nonceIntervalSeconds,
        licenseKey,
      } = req.body;

      if (
        !id ||
        !modelId ||
        !deviceId ||
        !modelName ||
        !modelVersion ||
        !deviceName ||
        !deviceSerial ||
        !expiresAt ||
        !licenseKey
      ) {
        return res.status(400).json({
          success: false,
          error:
            "Missing required deployment fields",
        });
      }

      const result = await pool.query(
        `
        INSERT INTO deployments (
          id,
          model_id,
          device_id,
          model_name,
          model_version,
          device_name,
          device_serial,
          expires_at,
          status,
          max_offline_days,
          nonce_interval_seconds,
          license_key
        )
        VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12
        )
        RETURNING *
        `,
        [
          id,
          modelId,
          deviceId,
          modelName,
          modelVersion,
          deviceName,
          deviceSerial,
          expiresAt,
          status || "active",
          maxOfflineDays ?? 7,
          nonceIntervalSeconds ?? 30,
          licenseKey,
        ]
      );

      res.status(201).json({
        success: true,
        deployment: result.rows[0],
      });
    } catch (error: any) {
      console.error(
        "Deployment insert failed:",
        error
      );

      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// ============================================================
// SECURITY VALIDATION
// ============================================================

app.get(
  "/api/security/validate/:deploymentId",
  async (req, res) => {
    try {
      const { deploymentId } = req.params;

      const result = await pool.query(
        `
        SELECT
          d.id AS deployment_id,
          d.status AS deployment_status,
          d.expires_at,

          d.device_id,
          dv.name AS device_name,
          dv.status AS device_status,

          d.model_id,
          m.name AS model_name,
          m.status AS model_status,

          mv.id AS version_id,
          mv.version AS model_version,
          mv.package_hash AS expected_package_hash,
          mv.status AS version_status,

          mp.id AS package_id,
          mp.encrypted_payload_hex AS package_payload,
          mp.status AS package_status,

          al.id AS licence_id,
          al.status AS licence_status,
          al.expiry_time AS licence_expiry,
          al.nonce,
          al.package_hash AS licence_package_hash

        FROM deployments d

        JOIN devices dv
          ON dv.id = d.device_id

        JOIN models m
          ON m.id = d.model_id

        LEFT JOIN model_versions mv
          ON mv.model_id = d.model_id
          AND mv.version = d.model_version

        LEFT JOIN model_packages mp
          ON mp.version_id = mv.id
          AND mp.status = 'active'

        LEFT JOIN activation_licences al
          ON al.deployment_id = d.id

        WHERE d.id = $1

        ORDER BY
          al.created_at DESC,
          mp.created_at DESC

        LIMIT 1
        `,
        [deploymentId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          authorized: false,
          error: "Deployment not found",
        });
      }

      const row = result.rows[0];
      const now = new Date();

      const deploymentValid =
        row.deployment_status === "active" &&
        row.expires_at &&
        new Date(row.expires_at) > now;

      const deviceValid =
        row.device_status === "online";

      const modelValid =
        row.model_status === "active";

      const licenceValid =
        row.licence_status === "active" &&
        row.licence_expiry &&
        new Date(row.licence_expiry) > now;

      let calculatedPackageHash:
        | string
        | null = null;

      if (
        row.package_payload !== null &&
        row.package_payload !== undefined
      ) {
        calculatedPackageHash =
          crypto
            .createHash("sha256")
            .update(
              Buffer.from(
                String(row.package_payload),
                "hex"
              )
            )
            .digest("hex");
      }

      const packageExists =
        !!row.package_id &&
        !!row.package_payload;

      const packageHashMatchesVersion =
        !!calculatedPackageHash &&
        !!row.expected_package_hash &&
        calculatedPackageHash.toLowerCase() ===
          String(
            row.expected_package_hash
          ).toLowerCase();

      const packageHashMatchesLicence =
        !!calculatedPackageHash &&
        !!row.licence_package_hash &&
        calculatedPackageHash.toLowerCase() ===
          String(
            row.licence_package_hash
          ).toLowerCase();

      const packageIntegrityValid =
        packageExists &&
        row.package_status === "active" &&
        row.version_status === "active" &&
        packageHashMatchesVersion &&
        packageHashMatchesLicence;

      const authorized =
        deploymentValid &&
        deviceValid &&
        modelValid &&
        licenceValid &&
        packageIntegrityValid;

      res.json({
        success: true,
        authorized,

        checks: {
          deployment: deploymentValid,
          device: deviceValid,
          model: modelValid,
          activationLicence: licenceValid,
          packageIntegrity:
            packageIntegrityValid,
        },

        deployment: {
          id: row.deployment_id,
          status: row.deployment_status,
          expiresAt: row.expires_at,
        },

        device: {
          id: row.device_id,
          name: row.device_name,
          status: row.device_status,
        },

        model: {
          id: row.model_id,
          name: row.model_name,
          version: row.model_version,
          status: row.model_status,
        },

        package: {
          id: row.package_id,
          versionId: row.version_id,
          status: row.package_status,
          expectedHash:
            row.expected_package_hash,
          calculatedHash:
            calculatedPackageHash,
          licenceHash:
            row.licence_package_hash,
          hashMatchesVersion:
            packageHashMatchesVersion,
          hashMatchesLicence:
            packageHashMatchesLicence,
          integrityValid:
            packageIntegrityValid,
        },

        licence: {
          id: row.licence_id,
          status: row.licence_status,
          expiry: row.licence_expiry,
          nonce: row.nonce,
        },
      });
    } catch (error: any) {
      console.error(
        "Security validation failed:",
        error
      );

      res.status(500).json({
        success: false,
        authorized: false,
        error: error.message,
      });
    }
  }
);

// ============================================================
// NONCE REPLAY PROTECTION
// ============================================================

app.post(
  "/api/security/consume-nonce",
  async (req, res) => {
    const client = await pool.connect();

    try {
      const {
        deploymentId,
        nonce,
      } = req.body;

      if (!deploymentId || !nonce) {
        return res.status(400).json({
          success: false,
          accepted: false,
          error:
            "deploymentId and nonce are required",
        });
      }

      await client.query("BEGIN");

      const deploymentResult =
        await client.query(
          `
          SELECT
            id,
            status,
            expires_at,
            active_nonces_used
          FROM deployments
          WHERE id = $1
          FOR UPDATE
          `,
          [deploymentId]
        );

      if (
        deploymentResult.rows.length === 0
      ) {
        await client.query("ROLLBACK");

        return res.status(404).json({
          success: false,
          accepted: false,
          error: "Deployment not found",
        });
      }

      const deployment =
        deploymentResult.rows[0];

      if (deployment.status !== "active") {
        await client.query("ROLLBACK");

        return res.status(403).json({
          success: false,
          accepted: false,
          error:
            "Deployment is not active",
        });
      }

      if (
        !deployment.expires_at ||
        new Date(
          deployment.expires_at
        ) <= new Date()
      ) {
        await client.query("ROLLBACK");

        return res.status(403).json({
          success: false,
          accepted: false,
          error:
            "Deployment has expired",
        });
      }

      const usedNonces: string[] =
        deployment.active_nonces_used || [];

      if (usedNonces.includes(nonce)) {
        await client.query("ROLLBACK");

        return res.status(409).json({
          success: false,
          accepted: false,
          replayDetected: true,
          error:
            "Nonce has already been used",
        });
      }

      await client.query(
        `
        UPDATE deployments
        SET active_nonces_used = array_append(
          COALESCE(active_nonces_used, '{}'),
          $1
        )
        WHERE id = $2
        `,
        [
          nonce,
          deploymentId,
        ]
      );

      await client.query("COMMIT");

      res.status(200).json({
        success: true,
        accepted: true,
        replayDetected: false,
        deploymentId,
        nonce,
      });
    } catch (error: any) {
      await client.query("ROLLBACK");

      console.error(
        "Nonce consumption failed:",
        error
      );

      res.status(500).json({
        success: false,
        accepted: false,
        error: error.message,
      });
    } finally {
      client.release();
    }
  }
);

// ============================================================
// HEALTH
// ============================================================

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "TFrenzy ModelGuard API",
    timestamp: new Date().toISOString(),
  });
});

// ============================================================
// GEMINI SECURITY AUDIT
// ============================================================

app.post(
  "/api/security-audit",
  async (req, res) => {
    try {
      const ai = getGeminiClient();

      if (!ai) {
        return res.json({
          success: false,
          fallback: true,
          analysis:
            "Gemini API key is not configured. Using fallback local security analyzer.",
          recommendations: [
            "Ensure device certificate renewal interval is strictly less than 30 days.",
            "Verify that nonces are strictly single-use to prevent replay attacks.",
            "Verify SHA-256 package integrity before model activation.",
            "Confirm zeroing of CUDA pinned memory after TensorRT engine deserialization.",
          ],
        });
      }

      const {
        logs,
        systemState,
      } = req.body;

      const prompt = `
You are a Senior AI Security Architect specializing in:

- TensorRT model protection
- Jetson Orin Nano security
- mTLS device authorization
- encrypted AI model deployment
- SHA-256 package integrity
- activation licence security
- replay attack protection

Analyze the following ModelGuard audit information.

Logs:
${JSON.stringify(logs || []).slice(0, 3000)}

System State:
${JSON.stringify(systemState || {}).slice(0, 1000)}

Provide:

1. Overall Risk Score from 0 to 100
2. Threat Analysis
3. Detected Anomalies
4. Actionable Security Recommendations
`;

      let response: any;

      try {
        response =
          await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: prompt,
          });
      } catch (error: any) {
        console.error(
          "Gemini model request failed:",
          error
        );

        if (error?.status === 503) {
          console.warn(
            "Gemini temporarily unavailable due to high demand."
          );

          return res.json({
            success: true,
            fallback: true,
            analysis:
              "Gemini AI is temporarily unavailable due to high demand. Please try the security audit again shortly.",
            recommendations: [
              "Retry the Gemini audit after a short delay.",
              "Continue validating device authorization.",
              "Continue checking package SHA-256 integrity.",
              "Continue enforcing single-use nonces.",
            ],
          });
        }

        if (error?.status === 429) {
          return res.json({
            success: true,
            fallback: true,
            analysis:
              "Gemini AI request limit was reached temporarily. Please retry the security audit shortly.",
            recommendations: [
              "Retry after the API limit resets.",
              "Avoid sending repeated audit requests.",
            ],
          });
        }

        throw error;
      }

      res.json({
        success: true,
        fallback: false,
        analysis:
          response?.text ||
          "Gemini returned an empty analysis.",
      });
    } catch (error: any) {
      console.error(
        "Gemini Security Audit Error:",
        error
      );

      res.status(500).json({
        success: false,
        error:
          error.message ||
          "Failed to analyze security state",
      });
    }
  }
);

// ============================================================
// ACTIVATION LICENCES
// ============================================================

app.get(
  "/api/activation-licences",
  async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT
          id,
          deployment_id,
          device_id,
          model_id,
          package_hash,
          issue_time,
          expiry_time,
          nonce,
          signature_hex,
          status,
          created_at
        FROM activation_licences
        ORDER BY created_at DESC
      `);

      res.json({
        success: true,
        count: result.rows.length,
        licences: result.rows,
      });
    } catch (error: any) {
      console.error(
        "Activation licences fetch failed:",
        error
      );

      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

app.post(
  "/api/activation-licences",
  async (req, res) => {
    try {
      const {
        id,
        deploymentId,
        deviceId,
        modelId,
        packageHash,
        expiryTime,
        nonce,
        signatureHex,
        status,
      } = req.body;

      if (
        !id ||
        !deploymentId ||
        !deviceId ||
        !modelId ||
        !packageHash ||
        !expiryTime ||
        !nonce ||
        !signatureHex
      ) {
        return res.status(400).json({
          success: false,
          error:
            "Missing required activation licence fields",
        });
      }

      const result = await pool.query(
        `
        INSERT INTO activation_licences (
          id,
          deployment_id,
          device_id,
          model_id,
          package_hash,
          expiry_time,
          nonce,
          signature_hex,
          status
        )
        VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9
        )
        RETURNING *
        `,
        [
          id,
          deploymentId,
          deviceId,
          modelId,
          packageHash,
          expiryTime,
          nonce,
          signatureHex,
          status || "active",
        ]
      );

      res.status(201).json({
        success: true,
        licence: result.rows[0],
      });
    } catch (error: any) {
      console.error(
        "Activation licence insert failed:",
        error
      );

      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// ============================================================
// SERVER START
// ============================================================

async function startServer() {
  try {
    await pool.query("SELECT 1");

    console.log(
      "✅ PostgreSQL connected successfully"
    );

    if (process.env.NODE_ENV !== "production") {
      const vite = await createViteServer({
        server: {
          middlewareMode: true,
        },
        appType: "spa",
      });

      app.use(vite.middlewares);
    } else {
      const distPath = path.join(
        process.cwd(),
        "dist"
      );

      app.use(express.static(distPath));

      app.get("*", (req, res) => {
        res.sendFile(
          path.join(distPath, "index.html")
        );
      });
    }

    app.listen(
      PORT,
      "0.0.0.0",
      () => {
        console.log(
          `TFrenzy ModelGuard server running at http://0.0.0.0:${PORT}`
        );
      }
    );
  } catch (error: any) {
    console.error(
      "❌ Failed to start server:",
      error
    );

    process.exit(1);
  }
}
// ============================================================
// DEVICE STATUS / HEARTBEAT
// ============================================================

app.post(
  "/api/devices/:deviceId/status",
  async (req, res) => {
    try {
      const { deviceId } = req.params;

      const {
        timestamp,
        status,
        agentVersion,
      } = req.body;

      if (!deviceId) {
        return res.status(400).json({
          success: false,
          error: "Device ID is required",
        });
      }

      // Check whether device exists
      const deviceResult = await pool.query(
        `
        SELECT
          id,
          name,
          status
        FROM devices
        WHERE id = $1
        `,
        [deviceId]
      );

      if (deviceResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Device not found",
          deviceId,
        });
      }

      // Update device heartbeat/status
      const result = await pool.query(
        `
        UPDATE devices
SET
  last_seen_at = NOW()
WHERE id = $1
        RETURNING
          id,
          name,
          status,
          last_seen_at
        `,
        [
deviceId
        ]
      );

      console.log(
        `[DEVICE STATUS] ${deviceId} -> ${status || "online"}`
      );

      if (agentVersion) {
        console.log(
          `[DEVICE STATUS] Agent version: ${agentVersion}`
        );
      }

      if (timestamp) {
        console.log(
          `[DEVICE STATUS] Agent timestamp: ${timestamp}`
        );
      }

      res.json({
        success: true,
        message: "Device status updated successfully",
        device: result.rows[0],
        agentVersion:
          agentVersion || null,
        receivedAt:
          new Date().toISOString(),
      });
    } catch (error: any) {
      console.error(
        "Device status update failed:",
        error
      );

      res.status(500).json({
        success: false,
        error:
          error.message ||
          "Failed to update device status",
      });
    }
  }
);

startServer();
