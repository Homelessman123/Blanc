import React, { useState } from 'react';
import {
  Trash2,
  Image as ImageIcon,
  Type,
  List,
  Quote,
  GripVertical,
  Wand2,
  MoveUp,
  MoveDown,
  Plus,
} from 'lucide-react';
import { improveText } from '../services/aiHelpers';
import type { Block, BlockType } from '../types';

interface BlockEditorProps {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
}

export const BlockEditor: React.FC<BlockEditorProps> = ({ blocks, onChange }) => {
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);

  const addBlock = (type: BlockType, index?: number) => {
    const newBlock: Block = {
      id: Math.random().toString(36).slice(2, 9),
      type,
      content: '',
    };
    if (index !== undefined) {
      const next = [...blocks];
      next.splice(index + 1, 0, newBlock);
      onChange(next);
    } else {
      onChange([...blocks, newBlock]);
    }
  };

  const updateBlock = (id: string, content: string) => {
    onChange(blocks.map((block) => (block.id === id ? { ...block, content } : block)));
  };

  const removeBlock = (id: string) => {
    onChange(blocks.filter((block) => block.id !== id));
  };

  const moveBlock = (index: number, direction: -1 | 1) => {
    if ((direction === -1 && index === 0) || (direction === 1 && index === blocks.length - 1)) return;
    const next = [...blocks];
    [next[index], next[index + direction]] = [next[index + direction], next[index]];
    onChange(next);
  };

  const handleAiImprove = async (id: string, text: string) => {
    if (!text.trim()) return;
    setAiLoading(id);
    const improved = await improveText(text);
    updateBlock(id, improved);
    setAiLoading(null);
  };

  const baseInputClass = 'w-full bg-transparent outline-none transition-all duration-200';

  const renderBlockInput = (block: Block, index: number) => {
    const isFocused = focusedBlockId === block.id;

    return (
      <div
        key={block.id}
        className="group relative flex items-start -ml-12 pl-12 pr-4 py-1 mb-2 hover:bg-slate-50/50 rounded-lg"
        onMouseEnter={() => setFocusedBlockId(block.id)}
        onMouseLeave={() => setFocusedBlockId(null)}
      >
        <div className={`absolute left-0 top-2 flex items-center gap-1 transition-opacity duration-200 ${isFocused ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex flex-col text-slate-400">
            <button onClick={() => moveBlock(index, -1)} className="hover:text-indigo-600 p-0.5" aria-label="Move up">
              <MoveUp size={12} />
            </button>
            <button onClick={() => moveBlock(index, 1)} className="hover:text-indigo-600 p-0.5" aria-label="Move down">
              <MoveDown size={12} />
            </button>
          </div>
          <span className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 p-1">
            <GripVertical size={16} />
          </span>
          <button onClick={() => removeBlock(block.id)} className="text-slate-300 hover:text-red-500 p-1" aria-label="Remove block">
            <Trash2 size={16} />
          </button>
        </div>

        <div className="flex-grow relative">
          {block.type === 'h2' && (
            <textarea
              value={block.content}
              onChange={(e) => updateBlock(block.id, e.target.value)}
              placeholder="Section heading (H2)"
              rows={1}
              className={`${baseInputClass} text-2xl font-bold text-slate-800 placeholder:text-slate-300 resize-none overflow-hidden`}
              onInput={(e) => {
                e.currentTarget.style.height = 'auto';
                e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
              }}
            />
          )}
          {block.type === 'h3' && (
            <textarea
              value={block.content}
              onChange={(e) => updateBlock(block.id, e.target.value)}
              placeholder="Sub heading (H3)"
              rows={1}
              className={`${baseInputClass} text-xl font-semibold text-slate-700 placeholder:text-slate-300 mt-2 resize-none overflow-hidden`}
              onInput={(e) => {
                e.currentTarget.style.height = 'auto';
                e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
              }}
            />
          )}
          {block.type === 'paragraph' && (
            <div className="relative">
              <textarea
                value={block.content}
                onChange={(e) => updateBlock(block.id, e.target.value)}
                placeholder="Type paragraph content..."
                className={`${baseInputClass} text-lg text-slate-600 leading-relaxed resize-none min-h-[3rem] placeholder:text-slate-300`}
                onInput={(e) => {
                  e.currentTarget.style.height = 'auto';
                  e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
                }}
              />
              {block.content.length > 10 && isFocused && (
                <button
                  onClick={() => handleAiImprove(block.id, block.content)}
                  disabled={aiLoading === block.id}
                  className="absolute -right-8 top-0 p-1.5 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all opacity-0 group-hover:opacity-100"
                  title="AI improve text"
                >
                  <Wand2 size={16} className={aiLoading === block.id ? 'animate-spin' : ''} />
                </button>
              )}
            </div>
          )}
          {block.type === 'quote' && (
            <div className="flex">
              <div className="w-1 bg-indigo-500 rounded-full mr-4 flex-shrink-0" />
              <textarea
                value={block.content}
                onChange={(e) => updateBlock(block.id, e.target.value)}
                placeholder="Quote text..."
                className={`${baseInputClass} text-xl italic font-serif text-slate-700 placeholder:text-slate-300 resize-none`}
                onInput={(e) => {
                  e.currentTarget.style.height = 'auto';
                  e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
                }}
              />
            </div>
          )}
          {block.type === 'image' && (
            <div className="my-2 group/image">
              {block.content ? (
                <div className="relative">
                  <img
                    src={block.content}
                    alt="Preview"
                    className="w-full max-h-[500px] object-cover rounded-lg shadow-sm border border-slate-100"
                  />
                  <button
                    onClick={() => updateBlock(block.id, '')}
                    className="absolute top-2 right-2 bg-black/50 hover:bg-red-500 text-white p-1 rounded-md opacity-0 group-hover/image:opacity-100 transition-opacity"
                    aria-label="Clear image"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-4 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200 hover:border-indigo-300 transition-colors">
                  <ImageIcon className="text-slate-400" />
                  <input
                    type="text"
                    value={block.content}
                    onChange={(e) => updateBlock(block.id, e.target.value)}
                    placeholder="Paste image URL..."
                    className="flex-1 bg-transparent outline-none text-sm text-slate-600"
                  />
                </div>
              )}
            </div>
          )}
          {block.type === 'list' && (
            <div className="flex gap-2">
              <div className="mt-2 w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0" />
              <textarea
                value={block.content}
                onChange={(e) => updateBlock(block.id, e.target.value)}
                placeholder="List items, each on a new line"
                className={`${baseInputClass} text-lg text-slate-600 resize-none`}
                onInput={(e) => {
                  e.currentTarget.style.height = 'auto';
                  e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
                }}
              />
            </div>
          )}
        </div>

        <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 z-10 transition-opacity duration-200 ${isFocused ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <button
            onClick={(e) => {
              const menu = e.currentTarget.nextElementSibling;
              if (menu) {
                menu.classList.toggle('hidden');
              }
            }}
            className="bg-slate-200 hover:bg-indigo-500 hover:text-white text-slate-500 rounded-full p-1 shadow-sm transition-colors"
            aria-label="Add block"
          >
            <Plus size={14} />
          </button>
          <div className="hidden absolute top-6 left-1/2 -translate-x-1/2 bg-white shadow-xl border border-slate-200 rounded-lg p-1 flex gap-1 whitespace-nowrap">
            <ToolButtonSmall icon={<Type size={14} />} onClick={() => addBlock('h2', index)} />
            <ToolButtonSmall icon={<Type size={12} />} onClick={() => addBlock('paragraph', index)} />
            <ToolButtonSmall icon={<ImageIcon size={14} />} onClick={() => addBlock('image', index)} />
            <ToolButtonSmall icon={<List size={14} />} onClick={() => addBlock('list', index)} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full min-h-[200px] pb-20">
      {blocks.map((block, index) => renderBlockInput(block, index))}

      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 bg-white/90 backdrop-blur-md border border-slate-200 shadow-lg shadow-slate-200/50 rounded-full px-4 py-2 flex items-center gap-2 transition-all hover:scale-105">
        <ToolButton icon={<Type size={20} />} label="Heading" onClick={() => addBlock('h2')} />
        <ToolButton icon={<Type size={16} />} label="Paragraph" onClick={() => addBlock('paragraph')} />
        <div className="w-px h-4 bg-slate-200 mx-1" />
        <ToolButton icon={<Quote size={18} />} label="Quote" onClick={() => addBlock('quote')} />
        <ToolButton icon={<List size={18} />} label="List" onClick={() => addBlock('list')} />
        <ToolButton icon={<ImageIcon size={18} />} label="Image" onClick={() => addBlock('image')} />
      </div>
    </div>
  );
};

const ToolButton: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void }> = ({
  icon,
  label,
  onClick,
}) => (
  <button
    onClick={onClick}
    className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 transition-all relative group"
    type="button"
  >
    {icon}
    <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
      {label}
    </span>
  </button>
);

const ToolButtonSmall: React.FC<{ icon: React.ReactNode; onClick: () => void }> = ({
  icon,
  onClick,
}) => (
  <button onClick={onClick} className="p-1.5 hover:bg-slate-100 rounded text-slate-500" type="button">
    {icon}
  </button>
);
