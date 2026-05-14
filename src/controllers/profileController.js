const fs = require("fs");
const path = require("path");
const { updateProfileImage } = require("../services/userService");

const UPLOAD_DIR = path.join(__dirname, "../../public/uploads/profile");
const PUBLIC_UPLOAD_PATH = "/uploads/profile";
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const MIME_TO_EXTENSION = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function parseDataUrl(dataUrl = "") {
  const match = String(dataUrl).match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!match) return null;

  return {
    mime: match[1],
    buffer: Buffer.from(match[2], "base64"),
  };
}

async function uploadProfilePhoto(req, res) {
  const user = req.session.user;
  const parsed = parseDataUrl(req.body.imageData);

  if (!parsed || !MIME_TO_EXTENSION[parsed.mime]) {
    req.flash("error", "Format foto tidak valid. Gunakan JPG, PNG, atau WEBP.");
    return res.redirect("/profile");
  }

  if (parsed.buffer.length > MAX_IMAGE_BYTES) {
    req.flash("error", "Ukuran foto maksimal 3MB.");
    return res.redirect("/profile");
  }

  fs.mkdirSync(UPLOAD_DIR, { recursive: true });

  const extension = MIME_TO_EXTENSION[parsed.mime];
  const filename = `user-${user.id}-${Date.now()}.${extension}`;
  const filePath = path.join(UPLOAD_DIR, filename);
  fs.writeFileSync(filePath, parsed.buffer);

  const publicPath = `${PUBLIC_UPLOAD_PATH}/${filename}`;
  const updatedUser = await updateProfileImage(user.id, publicPath);

  if (updatedUser) {
    req.session.user = updatedUser;
    req.flash("message", "Foto profil berhasil diperbarui.");
  } else {
    req.flash("error", "Gagal memperbarui foto profil.");
  }

  return res.redirect("/profile");
}

module.exports = {
  uploadProfilePhoto,
};
