import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import prisma from '../db';
import { uploadMediaViaAppsScript } from '../services/appsScriptMedia.service';

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads/gifs');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage (disk) for legacy GIF uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'gif-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter to accept only GIF files
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype === 'image/gif') {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file GIF!'));
  }
};

// Configure multer for GIF uploads (legacy, local disk)
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  }
});

// Configure multer for Apps Script uploads (in memory)
const mediaMemoryStorage = multer.memoryStorage();
export const uploadMedia = multer({
  storage: mediaMemoryStorage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
});

// Upload GIF handler
export const uploadGif = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Vui lòng chọn file GIF!' });
    }

    const userId = req.user?.id;
    if (!userId) {
      // Delete uploaded file if user not authenticated
      fs.unlinkSync(req.file.path);
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Generate public URL for the uploaded GIF
    const gifUrl = `/uploads/gifs/${req.file.filename}`;

    // Optionally update user's profileGif in database
    if (req.body.setAsProfile === 'true') {
      await prisma.user.update({
        where: { id: userId },
        data: { profileGif: gifUrl },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Tải GIF lên thành công!',
      gifUrl: gifUrl,
      filename: req.file.filename,
      url: gifUrl,
    });
  } catch (error: any) {
    console.error('Upload GIF error:', error);
    
    // Clean up uploaded file on error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ 
      message: error.message || 'Có lỗi xảy ra khi tải file!' 
    });
  }
};

// Upload media via Apps Script (images/gif/video)
export const uploadMediaToAppsScript = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Vui lòng chọn file media!' });
    }

    const appsScriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
    if (!appsScriptUrl) {
      return res.status(500).json({ message: 'GOOGLE_APPS_SCRIPT_URL chưa được cấu hình' });
    }

    const courseId = req.body.courseId || req.body.relatedId || req.user?.id || 'course';
    const setAsProfile = req.body.setAsProfile === 'true';

    const uploadResult = await uploadMediaViaAppsScript({
      buffer: req.file.buffer,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      courseId,
    });

    const mediaUrl = uploadResult.viewUrl || uploadResult.downloadUrl;

    if (setAsProfile && req.user?.id && mediaUrl) {
      await prisma.user.update({
        where: { id: req.user.id },
        data: { profileGif: mediaUrl },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Tải media lên Google Drive thành công',
      fileId: uploadResult.fileId,
      fileName: uploadResult.fileName,
      mimeType: uploadResult.mimeType,
      viewUrl: uploadResult.viewUrl,
      downloadUrl: uploadResult.downloadUrl,
      url: mediaUrl,
      gifUrl: mediaUrl,
      courseId,
    });
  } catch (error: any) {
    console.error('Upload media via Apps Script error:', error);
    res.status(500).json({ message: error.message || 'Có lỗi xảy ra khi tải media' });
  }
};

// Get all uploaded GIFs for a user
export const getUserGifs = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Read all files from user's uploads directory
    const files = fs.readdirSync(uploadsDir);
    const gifFiles = files
      .filter(file => file.endsWith('.gif'))
      .map(file => ({
        filename: file,
        url: `/uploads/gifs/${file}`,
        uploadDate: fs.statSync(path.join(uploadsDir, file)).mtime,
      }))
      .sort((a, b) => b.uploadDate.getTime() - a.uploadDate.getTime());

    res.status(200).json({
      success: true,
      gifs: gifFiles,
    });
  } catch (error) {
    console.error('Get user GIFs error:', error);
    res.status(500).json({ message: 'Có lỗi xảy ra khi tải danh sách GIF!' });
  }
};

// Delete uploaded GIF
export const deleteGif = async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const filePath = path.join(uploadsDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File không tồn tại!' });
    }

    // Delete file
    fs.unlinkSync(filePath);

    // If this was user's profile GIF, remove it from database
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.profileGif === `/uploads/gifs/${filename}`) {
      await prisma.user.update({
        where: { id: userId },
        data: { profileGif: null },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Xóa GIF thành công!',
    });
  } catch (error) {
    console.error('Delete GIF error:', error);
    res.status(500).json({ message: 'Có lỗi xảy ra khi xóa file!' });
  }
};
