import React, { useMemo, useState } from 'react';
import { ArrowLeft, Save, Layout, Eye, FileText, Sparkles } from 'lucide-react';
import { BlockEditor } from './BlockEditor';
import { ContentType } from '../types';
import type { Block, ContestFormValues, ProductFormValues } from '../types';

interface ContentEditorProps {
  type: ContentType;
  contestForm: ContestFormValues;
  productForm: ProductFormValues;
  onContestChange: (form: ContestFormValues) => void;
  onProductChange: (form: ProductFormValues) => void;
  onSave: () => void;
  onBack: () => void;
  saving?: boolean;
}

const inputClass =
  'w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-800';

const TEMPLATES: { id: string; name: string; description: string; blocks: Omit<Block, 'id'>[] }[] = [
  {
    id: 'blank',
    name: 'Trang trống',
    description: 'Bắt đầu từ con số 0. Tự do sáng tạo.',
    blocks: [{ type: 'paragraph', content: '' }],
  },
  {
    id: 'competition',
    name: 'Công bố Cuộc thi',
    description: 'Mẫu chuẩn gồm banner, giới thiệu, thể lệ và giải thưởng.',
    blocks: [
      { type: 'image', content: 'https://picsum.photos/800/360' },
      { type: 'h2', content: 'Giới thiệu cuộc thi' },
      { type: 'paragraph', content: 'Mô tả ngắn gọn về mục đích và ý nghĩa của cuộc thi này...' },
      { type: 'h2', content: 'Thể lệ tham gia' },
      { type: 'list', content: '- Đối tượng: Sinh viên\n- Hình thức: Online/Offline\n- Hạn nộp bài: 20/12' },
      { type: 'h2', content: 'Cơ cấu giải thưởng' },
      { type: 'paragraph', content: 'Tổng giá trị giải thưởng lên đến 100 triệu đồng.' },
    ],
  },
  {
    id: 'document',
    name: 'Chia sẻ Tài liệu',
    description: 'Cấu trúc tối ưu cho review và chia sẻ file.',
    blocks: [
      { type: 'h2', content: 'Tổng quan tài liệu' },
      { type: 'paragraph', content: 'Tài liệu này bao gồm các kiến thức trọng tâm...' },
      { type: 'quote', content: 'Tài liệu được biên soạn kỹ lưỡng bởi đội ngũ chuyên môn.' },
      { type: 'list', content: '- Chương 1: Giới thiệu\n- Chương 2: Phương pháp chính\n- Chương 3: Bài tập thực hành' },
    ],
  },
  {
    id: 'news',
    name: 'Tin tức & Sự kiện',
    description: 'Bản tin nhanh với hình ảnh và các điểm chính.',
    blocks: [
      { type: 'h2', content: 'Tiêu đề sự kiện nổi bật' },
      { type: 'paragraph', content: 'Sự kiện vừa diễn ra với nhiều hoạt động sôi nổi.' },
      { type: 'image', content: 'https://picsum.photos/900/450' },
      { type: 'h3', content: 'Điểm nhấn' },
      { type: 'list', content: '- Hơn 500 người tham dự\n- Nhiều workshop và phần thưởng' },
    ],
  },
];

export const ContentEditor: React.FC<ContentEditorProps> = ({
  type,
  contestForm,
  productForm,
  onContestChange,
  onProductChange,
  onSave,
  onBack,
  saving,
}) => {
  const isContest = type === ContentType.COMPETITION;
  const form = isContest ? contestForm : productForm;
  const [showTemplates, setShowTemplates] = useState(false);
  const [viewMode, setViewMode] = useState<'editor' | 'split' | 'preview'>('editor');

  const updateContest = <K extends keyof ContestFormValues>(
    key: K,
    value: ContestFormValues[K]
  ) => onContestChange({ ...contestForm, [key]: value });

  const updateProduct = <K extends keyof ProductFormValues>(
    key: K,
    value: ProductFormValues[K]
  ) => onProductChange({ ...productForm, [key]: value });

  const setField = (key: string, value: any) => {
    if (isContest) {
      updateContest(key as keyof ContestFormValues, value);
    } else {
      updateProduct(key as keyof ProductFormValues, value);
    }
  };

  const setBlocks = (blocks: any) => setField('blocks', blocks);

  const applyTemplate = (blocks: Omit<Block, 'id'>[]) => {
    const withIds = blocks.map((b) => ({ ...b, id: Math.random().toString(36).slice(2, 9) }));
    setBlocks(withIds);
    setShowTemplates(false);
  };

  const previewBlocks = useMemo(() => (form as any).blocks || [], [form]);

  const renderPreviewBlock = (block: Block) => {
    switch (block.type) {
      case 'h2':
        return <h2 className="text-2xl font-bold text-slate-800 mt-4 mb-2">{block.content}</h2>;
      case 'h3':
        return <h3 className="text-xl font-semibold text-slate-700 mt-3 mb-1">{block.content}</h3>;
      case 'paragraph':
        return <p className="text-base text-slate-600 leading-7 mb-2">{block.content}</p>;
      case 'image':
        return <img src={block.content} alt="Preview" className="w-full rounded-lg shadow-sm my-4" />;
      case 'quote':
        return (
          <blockquote className="border-l-4 border-indigo-500 pl-3 italic text-slate-700 my-3">
            {block.content}
          </blockquote>
        );
      case 'list': {
        const items = block.content.split('\n').filter(Boolean);
        return (
          <ul className="list-disc list-outside ml-5 space-y-1 text-base text-slate-600 mb-2">
            {items.map((item, idx) => (
              <li key={idx}>{item.replace(/^[*-]\s*/, '')}</li>
            ))}
          </ul>
        );
      }
      default:
        return null;
    }
  };

  const showEditor = viewMode !== 'preview';
  const showPreview = viewMode === 'preview' || viewMode === 'split';
  const editorColClass =
    viewMode === 'split' ? 'lg:col-span-2' : viewMode === 'preview' ? 'lg:col-span-0 hidden' : 'lg:col-span-3';
  const previewColClass = viewMode === 'split' ? 'lg:col-span-1' : 'lg:col-span-3';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-400">Trình soạn thảo</p>
            <h2 className="text-lg font-semibold text-slate-800">
              {isContest ? 'Cuộc thi' : 'Tài liệu / Khóa học'}
            </h2>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2 bg-slate-50 rounded-lg px-2 py-1">
          <button
            onClick={() => setViewMode('editor')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold ${
              viewMode === 'editor' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <Layout size={16} /> Soạn thảo
          </button>
          <button
            onClick={() => setViewMode('split')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold ${
              viewMode === 'split' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <Layout size={16} /> Song song
          </button>
          <button
            onClick={() => setViewMode('preview')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold ${
              viewMode === 'preview' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <Eye size={16} /> Xem trước
          </button>
          <button
            onClick={() => setShowTemplates(true)}
            className="ml-2 px-3 py-1.5 rounded-md text-sm font-semibold text-indigo-600 hover:bg-indigo-50 flex items-center gap-1"
          >
            <Sparkles size={16} /> Mẫu
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="ml-2 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-60 shadow-sm"
          >
            <Save size={18} />
            {saving ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        {showEditor && (
          <div className={`space-y-4 ${editorColClass}`}>
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-sm">
              <input
                className="w-full text-3xl font-bold text-slate-900 outline-none placeholder:text-slate-300"
                placeholder="Tiêu đề nội dung"
                value={(form as any).title}
                onChange={(e) => setField('title', e.target.value)}
              />
              <textarea
                className={`${inputClass} min-h-[100px]`}
                placeholder="Tóm tắt ngắn gọn..."
                value={(form as any).summary}
                onChange={(e) => setField('summary', e.target.value)}
              />
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-800 mb-3">Nội dung chi tiết</h3>
              <BlockEditor blocks={(form as any).blocks || []} onChange={setBlocks} />
            </div>
          </div>
        )}

        {showEditor && (
          <div className={`space-y-4 ${viewMode === 'split' ? '' : 'lg:col-span-3 lg:flex lg:gap-6'}`}>
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
              <label className="text-xs font-semibold text-slate-500 uppercase">Trạng thái</label>
              <select
                className={inputClass}
                value={(form as any).status}
                onChange={(e) => setField('status', e.target.value)}
              >
                <option value="DRAFT">Nháp</option>
                <option value="PUBLISHED">Đã đăng</option>
                <option value="ARCHIVED">Lưu trữ</option>
              </select>

              <label className="text-xs font-semibold text-slate-500 uppercase">Ảnh bìa</label>
              <input
                className={inputClass}
                placeholder="https://..."
                value={(form as any).imageUrl}
                onChange={(e) => setField('imageUrl', e.target.value)}
              />
              {(form as any).imageUrl && (
                <img
                  src={(form as any).imageUrl}
                  alt="Cover"
                  className="w-full h-32 object-cover rounded-lg border border-slate-200"
                />
              )}
            </div>

            {isContest ? (
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
                <label className="text-xs font-semibold text-slate-500 uppercase">Đơn vị tổ chức</label>
                <input
                  className={inputClass}
                  placeholder="Đơn vị tổ chức"
                  value={contestForm.organizer}
                  onChange={(e) => updateContest('organizer', e.target.value)}
                />

                <label className="text-xs font-semibold text-slate-500 uppercase">Thời gian</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    className={inputClass}
                    value={contestForm.startDate}
                    onChange={(e) => updateContest('startDate', e.target.value)}
                  />
                  <input
                    type="date"
                    className={inputClass}
                    value={contestForm.endDate}
                    onChange={(e) => updateContest('endDate', e.target.value)}
                  />
                </div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Hạn đăng ký</label>
                <input
                  type="date"
                  className={inputClass}
                  value={contestForm.registrationDeadline}
                  onChange={(e) => updateContest('registrationDeadline', e.target.value)}
                />

                <label className="text-xs font-semibold text-slate-500 uppercase">Liên kết</label>
                <input
                  className={inputClass}
                  placeholder="Website hoặc form đăng ký"
                  value={contestForm.website}
                  onChange={(e) => updateContest('website', e.target.value)}
                />

                <label className="text-xs font-semibold text-slate-500 uppercase">Phí tham gia</label>
                <input
                  className={inputClass}
                  placeholder="0"
                  value={contestForm.fee}
                  onChange={(e) => updateContest('fee', e.target.value)}
                />

                <label className="text-xs font-semibold text-slate-500 uppercase">Đối tượng / Hình thức</label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    className={inputClass}
                    value={contestForm.format}
                    onChange={(e) => updateContest('format', e.target.value as any)}
                  >
                    <option value="">Chọn hình thức</option>
                    <option value="ONLINE">Online</option>
                    <option value="OFFLINE">Offline</option>
                    <option value="HYBRID">Hybrid</option>
                  </select>
                  <input
                    className={inputClass}
                    placeholder="Ví dụ: THPT, Đại học..."
                    value={contestForm.targetGrade}
                    onChange={(e) => updateContest('targetGrade', e.target.value)}
                  />
                </div>

                <label className="text-xs font-semibold text-slate-500 uppercase">Tags</label>
                <input
                  className={inputClass}
                  placeholder="IT, Hackathon..."
                  value={contestForm.tags}
                  onChange={(e) => updateContest('tags', e.target.value)}
                />

                <label className="text-xs font-semibold text-slate-500 uppercase">Lợi ích</label>
                <textarea
                  className={`${inputClass} min-h-[80px]`}
                  placeholder="Mỗi dòng một lợi ích"
                  value={contestForm.benefits}
                  onChange={(e) => updateContest('benefits', e.target.value)}
                />

                <label className="text-xs font-semibold text-slate-500 uppercase">Điều kiện</label>
                <textarea
                  className={`${inputClass} min-h-[80px]`}
                  placeholder="Mỗi dòng một điều kiện"
                  value={contestForm.eligibility}
                  onChange={(e) => updateContest('eligibility', e.target.value)}
                />
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
                <label className="text-xs font-semibold text-slate-500 uppercase">Loại</label>
                <select
                  className={inputClass}
                  value={productForm.type}
                  onChange={(e) => updateProduct('type', e.target.value as any)}
                >
                  <option value="DOCUMENT">Tài liệu</option>
                  <option value="COURSE">Khóa học trực tuyến</option>
                  <option value="WORKSHOP">Workshop</option>
                  <option value="CONSULTATION">Tư vấn</option>
                </select>

                <label className="text-xs font-semibold text-slate-500 uppercase">Gia</label>
                <input
                  className={inputClass}
                  placeholder="0"
                  value={productForm.price}
                  onChange={(e) => updateProduct('price', e.target.value)}
                />

                <label className="text-xs font-semibold text-slate-500 uppercase">Tệp tải xuống (nếu có)</label>
                <input
                  className={inputClass}
                  placeholder="https://..."
                  value={productForm.downloadUrl}
                  onChange={(e) => updateProduct('downloadUrl', e.target.value)}
                />

                <label className="text-xs font-semibold text-slate-500 uppercase">Mức độ / Thời lượng</label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    className={inputClass}
                    value={productForm.level}
                    onChange={(e) => updateProduct('level', e.target.value as any)}
                  >
                    <option value="">Chọn mức</option>
                    <option value="BEGINNER">Cơ bản</option>
                    <option value="INTERMEDIATE">Trung cấp</option>
                    <option value="ADVANCED">Nâng cao</option>
                    <option value="EXPERT">Chuyên gia</option>
                  </select>
                  <input
                    className={inputClass}
                    placeholder="Ví dụ: 8 tuần"
                    value={productForm.duration}
                    onChange={(e) => updateProduct('duration', e.target.value)}
                  />
                </div>

                <label className="text-xs font-semibold text-slate-500 uppercase">Ngôn ngữ</label>
                <input
                  className={inputClass}
                  placeholder="Ví dụ: Vietnamese"
                  value={productForm.language}
                  onChange={(e) => updateProduct('language', e.target.value)}
                />

                <label className="text-xs font-semibold text-slate-500 uppercase">Danh mục</label>
                <input
                  className={inputClass}
                  placeholder="Mỗi mục cách nhau bởi dấu phẩy"
                  value={productForm.categories}
                  onChange={(e) => updateProduct('categories', e.target.value)}
                />
              </div>
            )}
          </div>
        )}

        {showPreview && (
          <div className={`bg-white rounded-xl border border-slate-200 p-6 shadow-sm ${previewColClass}`}>
            <h3 className="text-sm font-semibold text-slate-500 uppercase mb-3">Xem trước</h3>
            <div className="space-y-3">
              <h1 className="text-2xl font-bold text-slate-900">{(form as any).title || 'Tiêu đề'}</h1>
              {(form as any).imageUrl && (
                <img src={(form as any).imageUrl} alt="Cover" className="w-full rounded-lg border border-slate-200" />
              )}
              {(form as any).summary && (
                <p className="text-base text-slate-600">{(form as any).summary}</p>
              )}
              <div className="space-y-2">
                {previewBlocks.map((block: Block) => (
                  <div key={block.id || Math.random().toString(36)}>{renderPreviewBlock(block)}</div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {showTemplates && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Chọn mẫu bài viết</h2>
                <p className="text-sm text-slate-500">Bắt đầu nhanh với các cấu trúc có sẵn</p>
              </div>
              <button
                onClick={() => setShowTemplates(false)}
                className="text-slate-400 hover:text-slate-600"
                aria-label="Close"
              >
                <FileText size={22} />
              </button>
            </div>
            <div className="p-8 overflow-y-auto bg-slate-50 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => applyTemplate(tpl.blocks)}
                  className="group relative bg-white rounded-xl border border-slate-200 p-6 text-left hover:border-indigo-500 hover:ring-1 hover:ring-indigo-500 transition-all shadow-sm hover:shadow-md flex flex-col h-full"
                >
                  <div className="w-12 h-12 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                    <FileText size={22} />
                  </div>
                  <h3 className="font-semibold text-slate-800 mb-2 text-lg">{tpl.name}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed flex-1">{tpl.description}</p>
                  <div className="mt-4 pt-4 border-t border-slate-50 text-indigo-600 text-sm font-medium">
                    Sử dụng mẫu này
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
