import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { AdminSidebar } from '../admin/components/AdminSidebar';
import { AdminDashboard } from '../admin/components/AdminDashboard';
import { ContentList } from '../admin/components/ContentList';
import { ContentEditor } from '../admin/components/ContentEditor';
import { UserList } from '../admin/components/UserList';
import { TeamPostList } from '../admin/components/TeamPostList';
import { ReviewModal } from '../admin/components/ReviewModal';
import {
  AdminPage as AdminPageType,
  ContentType,
  defaultContestForm,
  defaultProductForm,
  PaginationMeta,
  AdminAuditLog,
} from '../admin/types';
import { adminContentService } from '../services/adminContent';
import { contestToFormValues, productToFormValues } from '../admin/transformers';
import type { Contest, DocumentResource, User, TeamPostSummary, TeamRecruitmentStatus } from '../types';
import { adminAPI, communityAPI } from '../services/api';

const AdminPage: React.FC = () => {
  const { logout } = useAuth();

  const [page, setPage] = useState<AdminPageType>('dashboard');
  const [currentType, setCurrentType] = useState<ContentType>(ContentType.COMPETITION);
  const [contests, setContests] = useState<Contest[]>([]);
  const [documents, setDocuments] = useState<DocumentResource[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [userMeta, setUserMeta] = useState<PaginationMeta>({ total: 0, page: 1, pageSize: 20 });
  const [teamPosts, setTeamPosts] = useState<TeamPostSummary[]>([]);
  const [teamMeta, setTeamMeta] = useState<PaginationMeta>({ total: 0, page: 1, pageSize: 20 });
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [auditMeta, setAuditMeta] = useState<PaginationMeta>({ total: 0, page: 1, pageSize: 20 });
  const [auditLoading, setAuditLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'ALL' | 'USER' | 'ADMIN'>('ALL');
  const [teamSearch, setTeamSearch] = useState('');
  const [teamStatusFilter, setTeamStatusFilter] = useState<'ALL' | TeamRecruitmentStatus>('ALL');
  const [contestForm, setContestForm] = useState(defaultContestForm);
  const [productForm, setProductForm] = useState(defaultProductForm);
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewedItemTitle, setReviewedItemTitle] = useState('');
  const [reviewedItemReviews, setReviewedItemReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  
  const loadContent = async () => {
    setLoading(true);
    setError(null);
    try {
      const [contestData, documentData] = await Promise.all([
        adminContentService.fetchContests(),
        adminContentService.fetchDocuments(),
      ]);
      setContests(contestData);
      setDocuments(documentData);
    } catch (err) {
      console.error('Admin load failed', err);
      setError('Không thể tải dữ liệu quản trị. Kiểm tra đăng nhập admin và backend.');
      toast.error('Khong the tai du lieu admin');
    } finally {
      setLoading(false);
    }
  };

  const loadUsersList = async (nextPage = userMeta.page) => {
    setUsersLoading(true);
    try {
      const response = await adminAPI.getUsers({
        search: userSearch || undefined,
        role: userRoleFilter === 'ALL' ? undefined : userRoleFilter,
        page: nextPage,
        pageSize: userMeta.pageSize,
      });
      const payload: any = response.data;
      const usersPayload = payload?.users ?? payload?.data ?? payload ?? [];
      setUsers(Array.isArray(usersPayload) ? usersPayload : []);
      if (payload?.meta) {
        setUserMeta(payload.meta);
      } else {
        setUserMeta((prev) => ({ ...prev, page: nextPage, total: Array.isArray(usersPayload) ? usersPayload.length : prev.total }));
      }
    } catch (err) {
      console.error(err);
      toast.error('Khong the tai danh sach nguoi dung');
    } finally {
      setUsersLoading(false);
    }
  };

  const loadTeamPostsList = async (nextPage = teamMeta.page) => {
    setTeamsLoading(true);
    try {
      const response = await communityAPI.getTeamPosts({
        search: teamSearch || undefined,
        status: teamStatusFilter === 'ALL' ? undefined : teamStatusFilter,
        page: nextPage,
        pageSize: teamMeta.pageSize,
      });
      const payload: any = response.data;
      const rawTeams = payload?.teams ?? payload?.data ?? payload ?? [];
      setTeamPosts(Array.isArray(rawTeams) ? rawTeams : []);
      if (payload?.meta) {
        setTeamMeta(payload.meta);
      } else {
        setTeamMeta((prev) => ({ ...prev, page: nextPage, total: Array.isArray(rawTeams) ? rawTeams.length : prev.total }));
      }
    } catch (err) {
      console.error(err);
      toast.error('Khong the tai bai dang cong dong');
    } finally {
      setTeamsLoading(false);
    }
  };

  const loadAuditLogs = async (nextPage = auditMeta.page) => {
    setAuditLoading(true);
    try {
      const response = await adminAPI.getAuditLogs({ page: nextPage, pageSize: auditMeta.pageSize });
      const payload: any = response.data;
      const logs = payload?.logs ?? payload?.data ?? [];
      setAuditLogs(Array.isArray(logs) ? logs : []);
      if (payload?.meta) {
        setAuditMeta(payload.meta);
      } else {
        setAuditMeta((prev) => ({ ...prev, page: nextPage, total: Array.isArray(logs) ? logs.length : prev.total }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAuditLoading(false);
    }
  };

  const reloadAll = () => {
    loadContent();
    loadUsersList(userMeta.page);
    loadTeamPostsList(teamMeta.page);
    loadAuditLogs(auditMeta.page);
  };

  const handleUserPageChange = (nextPage: number) => {
    setUserMeta((prev) => ({ ...prev, page: nextPage }));
    loadUsersList(nextPage);
  };

  const handleTeamPageChange = (nextPage: number) => {
    setTeamMeta((prev) => ({ ...prev, page: nextPage }));
    loadTeamPostsList(nextPage);
  };


  useEffect(() => {
    loadContent();
    loadUsersList(1);
    loadTeamPostsList(1);
    loadAuditLogs(1);
  }, []);

  useEffect(() => {
    setUserMeta((prev) => ({ ...prev, page: 1 }));
    loadUsersList(1);
  }, [userSearch, userRoleFilter]);

  useEffect(() => {
    setTeamMeta((prev) => ({ ...prev, page: 1 }));
    loadTeamPostsList(1);
  }, [teamSearch, teamStatusFilter]);

  const stats = useMemo(
    () => ({
      totalPosts: contests.length + documents.length,
      totalUsers: userMeta.total || users.length,
      contestCount: contests.length,
      documentCount: documents.length,
    }),
    [contests.length, documents.length, users.length, userMeta.total]
  );

  const adminContestItems = useMemo(
    () => contests.map(adminContentService.toAdminContestItem),
    [contests]
  );

  const adminDocumentItems = useMemo(
    () => documents.map(adminContentService.toAdminDocumentItem),
    [documents]
  );

  const startNew = (type: ContentType) => {
    setCurrentType(type);
    if (type === ContentType.COMPETITION) {
      setContestForm(defaultContestForm);
    } else {
      setProductForm(defaultProductForm);
    }
    setPage('editor');
  };

  const openContestEditor = (id: string) => {
    const target = contests.find((item) => item.id === id);
    if (!target) {
      toast.error('Khong tim thay cuoc thi');
      return;
    }
    setCurrentType(ContentType.COMPETITION);
    setContestForm(contestToFormValues(target));
    setPage('editor');
  };

  const openDocumentEditor = (id: string) => {
    const target = documents.find((item) => item.id === id);
    if (!target) {
      toast.error('Khong tim thay tai lieu/khoa hoc');
      return;
    }
    setCurrentType(ContentType.DOCUMENT);
    setProductForm(productToFormValues(target));
    setPage('editor');
  };

  const handleDeleteContest = async (id: string) => {
    if (!window.confirm('Xoa cuoc thi nay?')) return;
    try {
      await adminContentService.deleteContest(id);
      toast.success('Da xoa cuoc thi');
      await loadContent();
      await loadAuditLogs(1);
    } catch (err) {
      console.error(err);
      toast.error('Khong the xoa cuoc thi');
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (!window.confirm('Xoa tai lieu/khoa hoc nay?')) return;
    try {
      await adminContentService.deleteDocument(id);
      toast.success('Da xoa noi dung');
      await loadContent();
      await loadAuditLogs(1);
    } catch (err) {
      console.error(err);
      toast.error('Khong the xoa noi dung');
    }
  };

  const handleViewReviews = async (id: string, title: string) => {
    setReviewsLoading(true);
    setReviewedItemTitle(title);
    setReviewModalOpen(true);
    try {
      const reviews = await adminContentService.fetchDocumentReviews(id);
      setReviewedItemReviews(Array.isArray(reviews) ? reviews : []);
    } catch (err) {
      console.error(err);
      toast.error('Khong the tai danh gia');
      setReviewedItemReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleUserRoleChange = async (userId: string, role: 'USER' | 'ADMIN') => {
    try {
      await adminAPI.updateUserRole(userId, role);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
      toast.success('Da cap nhat quyen');
      loadAuditLogs(1);
    } catch {
      toast.error('Khong the cap nhat quyen');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Xoa nguoi dung nay?')) return;
    try {
      await adminAPI.deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      toast.success('Da xoa nguoi dung');
      loadAuditLogs(1);
    } catch {
      toast.error('Khong the xoa nguoi dung');
    }
  };

  const handleTeamStatusChange = async (id: string, status: TeamRecruitmentStatus) => {
    try {
      await adminAPI.updateTeamPostStatus(id, status);
      setTeamPosts((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
      toast.success('Da cap nhat trang thai');
      loadAuditLogs(1);
    } catch {
      toast.error('Khong the cap nhat trang thai');
    }
  };

  const handleTeamDelete = async (id: string) => {
    if (!window.confirm('Xoa bai viet nay?')) return;
    try {
      await adminAPI.deleteTeamPost(id);
      setTeamPosts((prev) => prev.filter((p) => p.id !== id));
      toast.success('Da xoa bai viet');
      loadAuditLogs(1);
    } catch {
      toast.error('Khong the xoa bai viet');
    }
  };

  const validateContestForm = () => {
    if (!contestForm.title.trim()) {
      toast.error('Vui long nhap tieu de cuoc thi');
      return false;
    }
    if (!contestForm.organizer.trim()) {
      toast.error('Vui long nhap don vi to chuc');
      return false;
    }
    if (!contestForm.startDate) {
      toast.error('Vui long chon ngay bat dau');
      return false;
    }
    if (!contestForm.endDate) {
      toast.error('Vui long chon ngay ket thuc');
      return false;
    }
    return true;
  };

  const validateProductForm = () => {
    if (!productForm.title.trim()) {
      toast.error('Vui long nhap tieu de');
      return false;
    }
    if (!productForm.price.toString().trim()) {
      toast.error('Vui long nhap gia');
      return false;
    }
    if (Number.isNaN(Number(productForm.price))) {
      toast.error('Gia khong hop le');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (currentType === ContentType.COMPETITION && !validateContestForm()) return;
    if (currentType === ContentType.DOCUMENT && !validateProductForm()) return;

    if (currentType === ContentType.COMPETITION) {
      const hasContent =
        contestForm.summary.trim() ||
        (contestForm.blocks && contestForm.blocks.some((block) => block.content.trim()));
      if (!hasContent) {
        toast.error('Vui long bo sung mo ta cho cuoc thi');
        return;
      }
    } else {
      const hasContent =
        productForm.summary.trim() ||
        (productForm.blocks && productForm.blocks.some((block) => block.content.trim()));
      if (!hasContent) {
        toast.error('Vui long bo sung mo ta cho noi dung nay');
        return;
      }
    }

    setSaving(true);
    try {
      if (currentType === ContentType.COMPETITION) {
        await adminContentService.saveContest(contestForm);
        toast.success('Da luu cuoc thi');
        setContestForm(defaultContestForm);
        setPage('competitions');
      } else {
        await adminContentService.saveDocument(productForm);
        toast.success('Da luu tai lieu/khoa hoc');
        setProductForm(defaultProductForm);
        setPage('documents');
      }
      await loadContent();
      await loadAuditLogs(1);
    } catch (err) {
      console.error(err);
      toast.error('Khong the luu noi dung');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <AdminSidebar
        currentPage={page}
        onNavigate={(next) => setPage(next)}
        onCreate={startNew}
        onLogout={logout}
      />

      <main className="flex-1 ml-64 p-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <div className="flex items-center justify-between gap-3">
              <span>{error}</span>
              <button
                onClick={reloadAll}
                className="text-sm font-semibold underline hover:text-red-800"
              >
                Thu lai
              </button>
            </div>
          </div>
        )}

        {page === 'dashboard' && (
          <AdminDashboard
            stats={stats}
            contests={adminContestItems}
            documents={adminDocumentItems}
            auditLogs={auditLogs}
            auditLoading={auditLoading}
            onRefreshAudit={() => loadAuditLogs(auditMeta.page)}
          />
        )}

        {page === 'competitions' && (
          <ContentList
            type={ContentType.COMPETITION}
            items={adminContestItems}
            loading={loading}
            onEdit={openContestEditor}
            onDelete={handleDeleteContest}
            onCreate={() => startNew(ContentType.COMPETITION)}
          />
        )}

        {page === 'documents' && (
          <ContentList
            type={ContentType.DOCUMENT}
            items={adminDocumentItems}
            loading={loading}
            onEdit={openDocumentEditor}
            onDelete={handleDeleteDocument}
            onCreate={() => startNew(ContentType.DOCUMENT)}
            onViewReviews={(id, title) => handleViewReviews(id, title)}
          />
        )}

        {page === 'users' && (
          <UserList
            users={users}
            loading={usersLoading}
            search={userSearch}
            roleFilter={userRoleFilter}
            page={userMeta.page}
            total={userMeta.total}
            pageSize={userMeta.pageSize}
            onSearchChange={setUserSearch}
            onRoleFilterChange={setUserRoleFilter}
            onPageChange={handleUserPageChange}
            onRefresh={() => loadUsersList(userMeta.page)}
            onRoleChange={handleUserRoleChange}
            onDelete={handleDeleteUser}
          />
        )}

        {page === 'community' && (
          <TeamPostList
            posts={teamPosts}
            loading={teamsLoading}
            search={teamSearch}
            status={teamStatusFilter}
            page={teamMeta.page}
            total={teamMeta.total}
            pageSize={teamMeta.pageSize}
            onSearchChange={setTeamSearch}
            onStatusFilterChange={setTeamStatusFilter}
            onPageChange={handleTeamPageChange}
            onRefresh={() => loadTeamPostsList(teamMeta.page)}
            onStatusChange={handleTeamStatusChange}
            onDelete={handleTeamDelete}
          />
        )}

        {page === 'editor' && (
          <ContentEditor
            type={currentType}
            contestForm={contestForm}
            productForm={productForm}
            onContestChange={setContestForm}
            onProductChange={setProductForm}
            onSave={handleSave}
            onBack={() => setPage(currentType === ContentType.COMPETITION ? 'competitions' : 'documents')}
            saving={saving}
          />
        )}
      </main>

      <ReviewModal
        open={reviewModalOpen}
        title={reviewedItemTitle}
        reviews={reviewedItemReviews}
        onClose={() => setReviewModalOpen(false)}
      />
    </div>
  );
};

export default AdminPage;
