'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  Key,
  Plus,
  Trash2,
  Pencil,
  CheckCircle2,
  Lock,
  Clock,
  LayoutGrid,
  Building2,
  DollarSign,
  Wrench,
  Check,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/context/LanguageContext';

interface UserItem {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar_url?: string;
  allowed_sections: string[];
  created_at: string;
}

const AVAILABLE_SECTIONS = [
  { id: 'overview', labelEn: 'Overview', labelEs: 'Resumen General', icon: LayoutGrid },
  { id: 'properties', labelEn: 'Properties & Suites', labelEs: 'Propiedades y Suites', icon: Building2 },
  { id: 'tenants', labelEn: 'Tenants & Leases', labelEs: 'Inquilinos y Contratos', icon: Users },
  { id: 'billing', labelEn: 'Billing & Finance', labelEs: 'Facturación y Finanzas', icon: DollarSign },
  { id: 'maintenance', labelEn: 'Helpdesk & Maintenance', labelEs: 'Mantenimiento', icon: Wrench },
];

export const SettingsView: React.FC = () => {
  const { language } = useLanguage();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'security'>('users');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'EMPLOYEE',
    allowed_sections: ['overview', 'properties'] as string[],
  });
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState('');

  // Fetch Users
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openNewUserModal = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'EMPLOYEE',
      allowed_sections: ['overview', 'properties'],
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const openEditUserModal = (u: UserItem) => {
    setEditingUser(u);
    setFormData({
      name: u.name,
      email: u.email,
      password: '', // blank unless editing
      role: u.role,
      allowed_sections: u.allowed_sections || ['overview', 'properties'],
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const toggleSectionPermission = (secId: string) => {
    setFormData((prev) => {
      const current = prev.allowed_sections || [];
      if (current.includes(secId)) {
        return { ...prev, allowed_sections: current.filter((s) => s !== secId) };
      } else {
        return { ...prev, allowed_sections: [...current, secId] };
      }
    });
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setModalError('');

    try {
      if (editingUser) {
        // Update user
        const res = await fetch('/api/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingUser.id,
            name: formData.name,
            role: formData.role,
            allowed_sections: formData.allowed_sections,
            password: formData.password || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || 'Error actualizando usuario');
      } else {
        // Create user
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || 'Error creando usuario');
      }

      setIsModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      setModalError(err.message || 'Error guardando usuario');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async (u: UserItem) => {
    if (!confirm(language === 'en' ? `Delete user ${u.name}?` : `¿Eliminar usuario ${u.name}?`)) return;

    try {
      const res = await fetch(`/api/users?id=${u.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Error');
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Error eliminando usuario');
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* Sub-menu Tabs */}
      <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3">
        <button
          onClick={() => setActiveSubTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'users'
              ? 'bg-[#D4AF37]/15 text-[#F3D270] border border-[#D4AF37]/30 shadow-md'
              : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <Users size={15} />
          <span>{language === 'en' ? 'User Management & Permissions' : 'Usuarios y Permisos de Menú'}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('security')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'security'
              ? 'bg-[#D4AF37]/15 text-[#F3D270] border border-[#D4AF37]/30 shadow-md'
              : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <Shield size={15} />
          <span>{language === 'en' ? 'Security & Inactivity Policy' : 'Seguridad y Políticas de Sesión'}</span>
        </button>
      </div>

      {/* USER MANAGEMENT TAB */}
      {activeSubTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                {language === 'en' ? 'System Users & Granular Access Control' : 'Usuarios del Sistema y Control de Acceso'}
              </h2>
              <p className="text-xs text-white/50">
                {language === 'en'
                  ? 'Define which lateral navigation sections each employee is authorized to view.'
                  : 'Define qué secciones del menú lateral está autorizado a ver cada empleado o administrador.'}
              </p>
            </div>

            <button
              onClick={openNewUserModal}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs text-[#070D18] bg-gradient-to-r from-[#F3D270] via-[#D4AF37] to-[#B89222] hover:opacity-95 shadow-md shadow-[#D4AF37]/20 cursor-pointer self-start sm:self-auto"
            >
              <Plus size={14} strokeWidth={2.5} />
              <span>{language === 'en' ? 'New System User' : 'Nuevo Usuario'}</span>
            </button>
          </div>

          {/* Users Table / List */}
          <div className="glass-card rounded-2xl border border-white/[0.08] overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-white/50">Cargando usuarios del sistema...</div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-white/[0.06] bg-white/[0.02] text-[11px] font-semibold text-white/50 uppercase tracking-wider">
                        <th className="py-4 px-6">{language === 'en' ? 'User' : 'Usuario'}</th>
                        <th className="py-4 px-6">{language === 'en' ? 'Role' : 'Rol'}</th>
                        <th className="py-4 px-6">{language === 'en' ? 'Authorized Lateral Sections' : 'Secciones Autorizadas'}</th>
                        <th className="py-4 px-6 text-right">{language === 'en' ? 'Actions' : 'Acciones'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.05]">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-[#1E3A5F] border border-[#D4AF37]/30 flex items-center justify-center font-bold text-xs text-[#F3D270]">
                                {u.name.charAt(0)}
                              </div>
                              <div>
                                <div className="font-bold text-white">{u.name}</div>
                                <div className="text-[11px] text-white/50">{u.email}</div>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-6">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                                u.role === 'SUPER_ADMIN'
                                  ? 'bg-[#D4AF37]/20 text-[#F3D270] border-[#D4AF37]/40'
                                  : u.role === 'ADMIN'
                                  ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                                  : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>

                          <td className="py-4 px-6">
                            <div className="flex flex-wrap items-center gap-1.5 max-w-lg">
                              {AVAILABLE_SECTIONS.map((sec) => {
                                const isAllowed = u.role === 'SUPER_ADMIN' || u.allowed_sections?.includes(sec.id);
                                return (
                                  <span
                                    key={sec.id}
                                    className={`px-2 py-0.5 rounded-md text-[10px] font-medium flex items-center gap-1 ${
                                      isAllowed
                                        ? 'bg-white/[0.08] text-white border border-white/10'
                                        : 'bg-white/[0.02] text-white/20 line-through'
                                    }`}
                                  >
                                    <sec.icon size={10} className={isAllowed ? 'text-[#F3D270]' : 'text-white/20'} />
                                    <span>{language === 'en' ? sec.labelEn : sec.labelEs}</span>
                                  </span>
                                );
                              })}
                            </div>
                          </td>

                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openEditUserModal(u)}
                                className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] text-white/70 hover:text-white transition-colors cursor-pointer"
                                title="Editar permisos"
                              >
                                <Pencil size={13} />
                              </button>
                              {u.role !== 'SUPER_ADMIN' && (
                                <button
                                  onClick={() => handleDeleteUser(u)}
                                  className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer"
                                  title="Eliminar usuario"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="block md:hidden p-3 space-y-3">
                  {users.map((u) => (
                    <div key={u.id} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-bold text-white text-sm">{u.name}</div>
                          <div className="text-xs text-white/50">{u.email}</div>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#D4AF37]/20 text-[#F3D270] border border-[#D4AF37]/30">
                          {u.role}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] text-white/40 block">Secciones autorizadas:</span>
                        <div className="flex flex-wrap gap-1">
                          {AVAILABLE_SECTIONS.map((sec) => {
                            const isAllowed = u.role === 'SUPER_ADMIN' || u.allowed_sections?.includes(sec.id);
                            return (
                              <span
                                key={sec.id}
                                className={`px-1.5 py-0.5 rounded text-[9px] ${
                                  isAllowed ? 'bg-white/[0.08] text-white font-medium' : 'hidden'
                                }`}
                              >
                                {language === 'en' ? sec.labelEn : sec.labelEs}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.04]">
                        <button onClick={() => openEditUserModal(u)} className="p-1.5 rounded-lg bg-white/[0.06] text-white/70">
                          <Pencil size={12} />
                        </button>
                        {u.role !== 'SUPER_ADMIN' && (
                          <button onClick={() => handleDeleteUser(u)} className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* SECURITY TAB */}
      {activeSubTab === 'security' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass-card rounded-2xl p-6 border border-white/[0.08] space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Clock size={20} />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Vencimiento de Sesión por Inactividad</h3>
                <p className="text-xs text-emerald-400 font-semibold">2 Horas Activas (Sliding Window)</p>
              </div>
            </div>
            <p className="text-xs text-white/60 leading-relaxed">
              Toda sesión inactiva por más de 120 minutos es destruida automáticamente en el servidor y navegador para evitar accesos no autorizados en terminales desatendidas.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6 border border-white/[0.08] space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#F3D270]">
                <Key size={20} />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Criptografía y Blindaje de Claves</h3>
                <p className="text-xs text-[#F3D270] font-semibold">Scrypt Salted Hashes (Node.js Crypto)</p>
              </div>
            </div>
            <p className="text-xs text-white/60 leading-relaxed">
              Cero almacenamiento de contraseñas en texto plano. Cada clave se hashea con sales criptográficas únicas de 16 bytes y comparación de tiempo constante contra ataques de temporización.
            </p>
          </div>
        </div>
      )}

      {/* NEW / EDIT USER MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? (language === 'en' ? 'Edit User Permissions' : 'Editar Permisos de Usuario') : (language === 'en' ? 'Create New System User' : 'Crear Usuario del Sistema')}
        subtitle={language === 'en' ? 'Manage roles and authorized sidebar sections' : 'Gestiona rol y selector de secciones del menú lateral'}
        maxWidth="lg"
      >
        <form onSubmit={handleSaveUser} className="space-y-4">
          {modalError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
              {modalError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label={language === 'en' ? 'Full Name' : 'Nombre Completo'}
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Carlos Mendoza"
            />
            <Input
              label={language === 'en' ? 'Email Address' : 'Correo Institucional'}
              type="email"
              required
              disabled={!!editingUser}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="user@hycoproperty.com"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1.5">
                {language === 'en' ? 'System Role' : 'Rol del Sistema'}
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-white bg-[#0B1526] border border-white/10 focus:border-[#D4AF37]"
              >
                <option value="EMPLOYEE">EMPLOYEE (Empleado de Operaciones)</option>
                <option value="ADMIN">ADMIN (Administrador de Propiedades)</option>
                <option value="SUPER_ADMIN">SUPER_ADMIN (Acceso Total)</option>
              </select>
            </div>

            <Input
              label={editingUser ? (language === 'en' ? 'New Password (Optional)' : 'Nueva Contraseña (Opcional)') : (language === 'en' ? 'Initial Password' : 'Contraseña de Acceso')}
              type="password"
              required={!editingUser}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••••••"
            />
          </div>

          {/* Granular Menu Sections Authorization Selector */}
          <div className="pt-2 border-t border-white/[0.08]">
            <label className="block text-xs font-bold text-white mb-1">
              {language === 'en' ? 'Sidebar Sections Authorization Selector' : 'Selector de Autorización para Menú Lateral'}
            </label>
            <p className="text-[11px] text-white/50 mb-3">
              {language === 'en'
                ? 'Check the sections this employee is permitted to view in the sidebar:'
                : 'Marca las secciones que este empleado tendrá permitido visualizar y acceder:'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {AVAILABLE_SECTIONS.map((sec) => {
                const isSelected = formData.allowed_sections?.includes(sec.id);
                return (
                  <button
                    type="button"
                    key={sec.id}
                    onClick={() => toggleSectionPermission(sec.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#D4AF37]/15 border-[#D4AF37]/50 text-white'
                        : 'bg-white/[0.02] border-white/[0.06] text-white/40 hover:text-white/70'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <sec.icon size={16} className={isSelected ? 'text-[#F3D270]' : 'text-white/30'} />
                      <span className="text-xs font-semibold">
                        {language === 'en' ? sec.labelEn : sec.labelEs}
                      </span>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                        isSelected
                          ? 'bg-[#D4AF37] border-[#D4AF37] text-[#070D18]'
                          : 'border-white/20 bg-transparent'
                      }`}
                    >
                      {isSelected && <Check size={12} strokeWidth={3} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08]">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              {language === 'en' ? 'Cancel' : 'Cancelar'}
            </Button>
            <Button type="submit" variant="primary" isLoading={isSaving}>
              {editingUser ? (language === 'en' ? 'Update Permissions' : 'Actualizar Permisos') : (language === 'en' ? 'Create User' : 'Crear Usuario')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
