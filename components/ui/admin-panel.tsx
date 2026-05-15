'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Save } from 'lucide-react';
import { ProjectIntelligence } from './project-intelligence-card';
import { designTokens } from './design-tokens';

interface AdminPanelProps {
  projects: ProjectIntelligence[];
  onProjectUpdate?: (id: string, updates: Partial<ProjectIntelligence>) => void;
  onProjectDelete?: (id: string) => void;
  onProjectCreate?: (project: Partial<ProjectIntelligence>) => void;
}

export function AdminPanel({ projects, onProjectUpdate, onProjectDelete, onProjectCreate }: AdminPanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editData, setEditData] = useState<Partial<ProjectIntelligence>>({});
  const [newProject, setNewProject] = useState<Partial<ProjectIntelligence>>({
    name: '',
    category: 'AI x Crypto',
    chain: 'Solana',
    stage: 'beta',
    rugRiskScore: 50,
    legitimacyScore: 50,
    innovationScore: 50,
  });

  const handleEditStart = (project: ProjectIntelligence) => {
    setEditingId(project.id);
    setEditData(project);
  };

  const handleEditSave = async () => {
    if (editingId && onProjectUpdate) {
      await onProjectUpdate(editingId, editData);
      setEditingId(null);
      setEditData({});
    }
  };

  const handleCreate = async () => {
    if (onProjectCreate && newProject.name) {
      await onProjectCreate(newProject);
      setShowCreateForm(false);
      setNewProject({
        name: '',
        category: 'AI x Crypto',
        chain: 'Solana',
        stage: 'beta',
        rugRiskScore: 50,
        legitimacyScore: 50,
        innovationScore: 50,
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold" style={{ color: designTokens.colors.text.primary }}>
          Admin Panel
        </h2>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium"
          style={{
            background: designTokens.colors.accent.primary,
            color: '#ffffff',
          }}
        >
          <Plus size={18} />
          New Project
        </motion.button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="p-6 rounded-lg border"
          style={{
            borderColor: designTokens.colors.border.default,
            background: designTokens.colors.bg.elevated,
          }}
        >
          <h3 className="font-semibold mb-4" style={{ color: designTokens.colors.text.primary }}>
            Create New Project
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <FormInput
              label="Project Name"
              value={newProject.name || ''}
              onChange={(value) => setNewProject({ ...newProject, name: value })}
            />
            <FormSelect
              label="Category"
              value={newProject.category || 'AI x Crypto'}
              options={['AI x Crypto', 'DeFi', 'Infra', 'Gaming', 'Wallet', 'DePIN']}
              onChange={(value) => setNewProject({ ...newProject, category: value })}
            />
            <FormSelect
              label="Chain"
              value={newProject.chain || 'Solana'}
              options={['Solana', 'Base', 'Ethereum', 'Arbitrum']}
              onChange={(value) => setNewProject({ ...newProject, chain: value })}
            />
            <FormSelect
              label="Stage"
              value={newProject.stage || 'beta'}
              options={['ideation', 'alpha', 'beta', 'launched']}
              onChange={(value) => setNewProject({ ...newProject, stage: value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <FormNumber
              label="Rug Risk"
              value={newProject.rugRiskScore || 50}
              onChange={(value) => setNewProject({ ...newProject, rugRiskScore: value })}
              min={0}
              max={100}
            />
            <FormNumber
              label="Legitimacy"
              value={newProject.legitimacyScore || 50}
              onChange={(value) => setNewProject({ ...newProject, legitimacyScore: value })}
              min={0}
              max={100}
            />
            <FormNumber
              label="Innovation"
              value={newProject.innovationScore || 50}
              onChange={(value) => setNewProject({ ...newProject, innovationScore: value })}
              min={0}
              max={100}
            />
          </div>

          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              onClick={handleCreate}
              className="px-4 py-2 rounded-lg font-medium text-white"
              style={{ background: designTokens.colors.accent.secondary }}
            >
              Create
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 rounded-lg font-medium border"
              style={{
                borderColor: designTokens.colors.border.default,
                color: designTokens.colors.text.primary,
              }}
            >
              Cancel
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Projects Table */}
      <div
        className="rounded-lg border overflow-hidden"
        style={{
          borderColor: designTokens.colors.border.default,
          background: designTokens.colors.bg.card,
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead
              style={{
                background: designTokens.colors.bg.elevated,
                borderBottom: `1px solid ${designTokens.colors.border.default}`,
              }}
            >
              <tr>
                <th className="px-6 py-3 text-left font-semibold" style={{ color: designTokens.colors.text.muted }}>
                  Project
                </th>
                <th className="px-6 py-3 text-left font-semibold" style={{ color: designTokens.colors.text.muted }}>
                  Category
                </th>
                <th className="px-6 py-3 text-center font-semibold" style={{ color: designTokens.colors.text.muted }}>
                  Rug Risk
                </th>
                <th className="px-6 py-3 text-center font-semibold" style={{ color: designTokens.colors.text.muted }}>
                  Legitimacy
                </th>
                <th className="px-6 py-3 text-center font-semibold" style={{ color: designTokens.colors.text.muted }}>
                  Innovation
                </th>
                <th className="px-6 py-3 text-center font-semibold" style={{ color: designTokens.colors.text.muted }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project, idx) => (
                <motion.tr
                  key={project.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    borderBottom: `1px solid ${designTokens.colors.border.subtle}`,
                  }}
                >
                  <td className="px-6 py-4">
                    {editingId === project.id ? (
                      <input
                        value={editData.name || ''}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                        className="px-2 py-1 rounded border text-sm"
                        style={{
                          borderColor: designTokens.colors.border.default,
                          background: designTokens.colors.bg.primary,
                        }}
                      />
                    ) : (
                      <span style={{ color: designTokens.colors.text.primary }} className="font-medium">
                        {project.name}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4" style={{ color: designTokens.colors.text.secondary }}>
                    {project.category}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {editingId === project.id ? (
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={editData.rugRiskScore || 0}
                        onChange={(e) =>
                          setEditData({ ...editData, rugRiskScore: parseInt(e.target.value) })
                        }
                        className="w-16 px-2 py-1 rounded border text-sm text-center"
                        style={{
                          borderColor: designTokens.colors.border.default,
                          background: designTokens.colors.bg.primary,
                        }}
                      />
                    ) : (
                      <span
                        className="font-semibold"
                        style={{
                          color:
                            project.rugRiskScore >= 70
                              ? designTokens.colors.signal.danger
                              : project.rugRiskScore >= 40
                                ? designTokens.colors.signal.warning
                                : designTokens.colors.signal.success,
                        }}
                      >
                        {project.rugRiskScore}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {editingId === project.id ? (
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={editData.legitimacyScore || 0}
                        onChange={(e) =>
                          setEditData({ ...editData, legitimacyScore: parseInt(e.target.value) })
                        }
                        className="w-16 px-2 py-1 rounded border text-sm text-center"
                        style={{
                          borderColor: designTokens.colors.border.default,
                          background: designTokens.colors.bg.primary,
                        }}
                      />
                    ) : (
                      <span style={{ color: designTokens.colors.accent.primary }} className="font-semibold">
                        {project.legitimacyScore}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {editingId === project.id ? (
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={editData.innovationScore || 0}
                        onChange={(e) =>
                          setEditData({ ...editData, innovationScore: parseInt(e.target.value) })
                        }
                        className="w-16 px-2 py-1 rounded border text-sm text-center"
                        style={{
                          borderColor: designTokens.colors.border.default,
                          background: designTokens.colors.bg.primary,
                        }}
                      />
                    ) : (
                      <span style={{ color: designTokens.colors.accent.secondary }} className="font-semibold">
                        {project.innovationScore}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {editingId === project.id ? (
                        <>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            onClick={handleEditSave}
                            className="p-1 rounded hover:opacity-70"
                            style={{ color: designTokens.colors.signal.success }}
                          >
                            <Save size={16} />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            onClick={() => setEditingId(null)}
                            className="p-1 rounded hover:opacity-70"
                            style={{ color: designTokens.colors.text.muted }}
                          >
                            ✕
                          </motion.button>
                        </>
                      ) : (
                        <>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            onClick={() => handleEditStart(project)}
                            className="p-1 rounded hover:opacity-70"
                            style={{ color: designTokens.colors.accent.primary }}
                          >
                            <Edit2 size={16} />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            onClick={() => onProjectDelete?.(project.id)}
                            className="p-1 rounded hover:opacity-70"
                            style={{ color: designTokens.colors.signal.danger }}
                          >
                            <Trash2 size={16} />
                          </motion.button>
                        </>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

interface FormInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function FormInput({ label, value, onChange }: FormInputProps) {
  return (
    <div>
      <label className="text-xs font-semibold mb-2 block" style={{ color: designTokens.colors.text.muted }}>
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded border text-sm"
        style={{
          borderColor: designTokens.colors.border.default,
          background: designTokens.colors.bg.primary,
          color: designTokens.colors.text.primary,
        }}
      />
    </div>
  );
}

interface FormSelectProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}

function FormSelect({ label, value, options, onChange }: FormSelectProps) {
  return (
    <div>
      <label className="text-xs font-semibold mb-2 block" style={{ color: designTokens.colors.text.muted }}>
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded border text-sm"
        style={{
          borderColor: designTokens.colors.border.default,
          background: designTokens.colors.bg.primary,
          color: designTokens.colors.text.primary,
        }}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

interface FormNumberProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
}

function FormNumber({ label, value, onChange, min, max }: FormNumberProps) {
  return (
    <div>
      <label className="text-xs font-semibold mb-2 block" style={{ color: designTokens.colors.text.muted }}>
        {label}
      </label>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full px-3 py-2 rounded border text-sm"
        style={{
          borderColor: designTokens.colors.border.default,
          background: designTokens.colors.bg.primary,
          color: designTokens.colors.text.primary,
        }}
      />
    </div>
  );
}
