import React, { useEffect, useMemo, useState } from 'react';
import {
    Award,
    Edit3,
    Loader2,
    Mail,
    MapPin,
    Plus,
    Search,
    Tag,
    UserPlus,
    Users,
    Phone,
    X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { CuteToast } from '../components/CuteToast';
import TeammateRecommendation from '../components/TeammateRecommendation';
import type { TeamPostDetail, TeamPostSummary, TeamRecruitmentStatus } from '../types';

const API_BASE_URL = 'http://localhost:3001/api';

const mapTeamSummary = (team: any): TeamPostSummary => {
    const activeCount =
        typeof team.activeMemberCount === 'number'
            ? team.activeMemberCount
            : Array.isArray(team.members)
                ? team.members.filter((member: any) => member.status === 'ACTIVE').length
                : team.membersCount ?? 0;

    const tags: string[] = Array.isArray(team.tags)
        ? team.tags
        : Array.isArray(team.tags?.map)
            ? team.tags.map((tag: any) => tag)
            : [];

    const owner = team.owner ?? {
        id: team.ownerId ?? '',
        displayName: '',
        name: '',
        avatar: null,
        profileColor: '#6366f1',
    };

    const membersPreview =
        team.membersPreview ??
        (Array.isArray(team.members)
            ? team.members.slice(0, 4).map((member: any) => ({
                id: member.user?.id ?? member.userId,
                displayName: member.user?.displayName ?? member.user?.name ?? '',
                name: member.user?.name,
                avatar: member.user?.avatar ?? null,
                profileColor: member.user?.profileColor ?? '#6366f1',
            }))
            : []);

    return {
        id: team.id,
        title: team.title,
        teamName: team.teamName ?? null,
        summary: team.summary ?? '',
        lookingFor: team.lookingFor ?? null,
        status: team.status ?? 'OPEN',
        maxMembers: team.maxMembers ?? activeCount,
        activeMemberCount: activeCount,
        tags,
        owner,
        membersPreview,
        channelId: team.channelId ?? team.channel?.id ?? null,
        isMember: Boolean(team.isMember),
    };
};

const mapTeamDetail = (team: any): TeamPostDetail => {
    const summary = mapTeamSummary(team);
    const members = Array.isArray(team.members)
        ? team.members.map((member: any) => ({
            id: member.id,
            teamId: member.teamId,
            userId: member.userId,
            role: member.role ?? null,
            status: member.status ?? 'ACTIVE',
            joinedAt: member.joinedAt ?? new Date().toISOString(),
            user: {
                id: member.user?.id ?? member.userId,
                displayName: member.user?.displayName ?? member.user?.name ?? '',
                name: member.user?.name ?? '',
                avatar: member.user?.avatar ?? null,
                profileColor: member.user?.profileColor ?? '#6366f1',
                email: member.user?.email ?? '',
                phoneNumber: member.user?.phoneNumber ?? null,
            },
        }))
        : [];

    return {
        ...summary,
        description: team.description ?? '',
        requirements: team.requirements ?? null,
        location: team.location ?? null,
        members,
    };
};

type TeamPostFormState = {
    title: string;
    teamName: string;
    summary: string;
    description: string;
    lookingFor: string;
    requirements: string;
    location: string;
    tags: string[];
    maxMembers: number;
    status: TeamRecruitmentStatus;
    members: {
        userId: string;
        displayName?: string;
        name?: string;
        email?: string;
        phoneNumber?: string | null;
        profileColor?: string | null;
        role: string;
    }[];
};

const emptyFormState: TeamPostFormState = {
    title: '',
    teamName: '',
    summary: '',
    description: '',
    lookingFor: '',
    requirements: '',
    location: '',
    tags: [],
    maxMembers: 4,
    status: 'OPEN',
    members: [],
};

const buildFormStateFromDetail = (team: TeamPostDetail): TeamPostFormState => ({
    title: team.title ?? '',
    teamName: team.teamName ?? '',
    summary: team.summary ?? '',
    description: team.description ?? '',
    lookingFor: team.lookingFor ?? '',
    requirements: team.requirements ?? '',
    location: team.location ?? '',
    tags: team.tags ?? [],
    maxMembers: team.maxMembers ?? Math.max(team.activeMemberCount, 1),
    status: team.status ?? 'OPEN',
    members: (team.members ?? [])
        .filter((member) => member.userId !== team.owner.id)
        .map((member) => ({
            userId: member.userId,
            displayName: member.user.displayName,
            name: member.user.name,
            email: member.user.email,
            phoneNumber: member.user.phoneNumber ?? null,
            profileColor: member.user.profileColor,
            role: member.role ?? 'Thành viên',
        })),
});

const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);

    if (diffMinutes < 1) return 'Vua cap nhat';
    if (diffMinutes < 60) return `${diffMinutes} phut truoc`;
    if (diffHours < 24) return `${diffHours} gio truoc`;
    if (diffDays < 7) return `${diffDays} ngay truoc`;
    if (diffWeeks < 4) return `${diffWeeks} tuan truoc`;
    return date.toLocaleDateString('vi-VN');
};

const CommunityPage: React.FC = () => {
    const { token, user } = useAuth();
    const navigate = useNavigate();

    const [teamPosts, setTeamPosts] = useState<TeamPostSummary[]>([]);
    const [teamsLoading, setTeamsLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState('');

    const [selectedTeam, setSelectedTeam] = useState<TeamPostDetail | null>(null);
    const [teamSuggestions, setTeamSuggestions] = useState<TeamPostSummary[]>([]);

    const [joiningTeamId, setJoiningTeamId] = useState<string | null>(null);

    const [toastMessage, setToastMessage] = useState('');
    const [showToast, setShowToast] = useState(false);
    const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create');
    const [editorOpen, setEditorOpen] = useState(false);
    const [editorData, setEditorData] = useState<TeamPostFormState>(emptyFormState);
    const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
    const [editorSaving, setEditorSaving] = useState(false);
    const [editorPrefilling, setEditorPrefilling] = useState(false);
    const [editorError, setEditorError] = useState<string | null>(null);
    const [memberSearch, setMemberSearch] = useState('');
    const [memberSuggestions, setMemberSuggestions] = useState<
        {
            id: string;
            displayName?: string | null;
            name?: string | null;
            email?: string | null;
            phoneNumber?: string | null;
            profileColor?: string | null;
        }[]
    >([]);
    const [memberSearching, setMemberSearching] = useState(false);
    useEffect(() => {
        if (!token) {
            return;
        }

        fetchTeamPosts();
    }, [token]);

    const fetchTeamPosts = async () => {
        if (!token) return;
        setTeamsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/community/team-posts`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                const teams: TeamPostSummary[] = (data.teams ?? []).map(mapTeamSummary);
                setTeamPosts(teams);
            }
        } catch (error) {
            console.error('Fetch team posts error:', error);
        } finally {
            setTeamsLoading(false);
        }
    };

    const loadTeamDetail = async (teamId: string) => {
        if (!token) return;

        try {
            const response = await fetch(`${API_BASE_URL}/community/team-posts/${teamId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                return {
                    detail: mapTeamDetail(data.team),
                    suggestions: (data.suggestions ?? []).map(mapTeamSummary),
                };
            }
        } catch (error) {
            console.error('Fetch team detail error:', error);
        }

        return null;
    };

    const fetchTeamDetail = async (teamId: string) => {
        const data = await loadTeamDetail(teamId);
        if (data) {
            setSelectedTeam(data.detail);
            setTeamSuggestions(data.suggestions);
        }
    };

    const handleJoinTeam = async (teamId: string) => {
        if (!token) {
            navigate('/login');
            return;
        }

        setJoiningTeamId(teamId);
        try {
            const response = await fetch(`${API_BASE_URL}/community/team-posts/${teamId}/join`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setToastMessage('Bạn đã tham gia nhóm! Vui lòng kiểm tra thông báo để xem thông tin liên lạc.');
                setShowToast(true);

                setTeamPosts((previous) =>
                    previous.map((post) =>
                        post.id === teamId
                            ? {
                                ...post,
                                isMember: true,
                                activeMemberCount: Math.min(post.maxMembers, post.activeMemberCount + 1),
                            }
                            : post
                    )
                );

                if (data.team) {
                    const refreshedDetail = mapTeamDetail(data.team);
                    setSelectedTeam((current) => (current && current.id === teamId ? refreshedDetail : current));
                } else if (selectedTeam?.id === teamId) {
                    await fetchTeamDetail(teamId);
                }
            } else if (response.status === 400) {
                const payload = await response.json();
                setToastMessage(payload.message ?? 'Không thể tham gia nhóm này.');
                setShowToast(true);
            }
        } catch (error) {
            console.error('Join team error:', error);
        } finally {
            setJoiningTeamId(null);
        }
    };

    const openCreateEditor = () => {
        if (!token) {
            navigate('/login');
            return;
        }

        setEditorMode('create');
        setEditorData(emptyFormState);
        setEditingTeamId(null);
        setEditorError(null);
        setEditorPrefilling(false);
        setEditorOpen(true);
        setMemberSearch('');
        setMemberSuggestions([]);
    };

    const openEditEditor = async (teamId: string) => {
        if (!token) {
            navigate('/login');
            return;
        }

        setEditorError(null);
        setEditorPrefilling(true);
        setMemberSearch('');
        setMemberSuggestions([]);

        let detail: TeamPostDetail | null = selectedTeam && selectedTeam.id === teamId ? selectedTeam : null;

        if (!detail) {
            const loaded = await loadTeamDetail(teamId);
            if (loaded?.detail) {
                detail = loaded.detail;
                setSelectedTeam((current) => (current && current.id === teamId ? loaded.detail : current));
                setTeamSuggestions((current) => (loaded.suggestions.length > 0 ? loaded.suggestions : current));
            }
        }

        if (!detail) {
            setEditorPrefilling(false);
            setEditorOpen(false);
            setToastMessage('Không thể mở form chỉnh sửa bài đăng.');
            setShowToast(true);
            return;
        }

        if (detail.owner.id !== user?.id) {
            setEditorPrefilling(false);
            setEditorOpen(false);
            setToastMessage('Bạn chỉ có thể chỉnh sửa bài đăng của chính mình.');
            setShowToast(true);
            return;
        }

        setEditorMode('edit');
        setEditingTeamId(teamId);
        setEditorData(buildFormStateFromDetail(detail));
        setEditorPrefilling(false);
        setEditorOpen(true);
    };

    const handleEditorFieldChange = (field: keyof TeamPostFormState, value: string | number | string[]) => {
        setEditorData((previous) => ({
            ...previous,
            [field]: value,
        }));
    };

    const handleAddTag = (tag: string) => {
        const normalized = tag.trim();
        if (!normalized) return;
        setEditorData((previous) => ({
            ...previous,
            tags: Array.from(new Set([...previous.tags, normalized])).slice(0, 10),
        }));
    };

    const handleRemoveTag = (tag: string) => {
        setEditorData((previous) => ({
            ...previous,
            tags: previous.tags.filter((item) => item !== tag),
        }));
    };

    const handleMemberSearch = async (value: string) => {
        setMemberSearch(value);
        if (!token) return;
        const query = value.trim();
        if (query.length < 2) {
            setMemberSuggestions([]);
            return;
        }

        setMemberSearching(true);
        try {
            const response = await fetch(`${API_BASE_URL}/users/search?query=${encodeURIComponent(query)}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                setMemberSuggestions(data.users ?? []);
            } else {
                setMemberSuggestions([]);
            }
        } catch (error) {
            console.error('Search members error:', error);
            setMemberSuggestions([]);
        } finally {
            setMemberSearching(false);
        }
    };

    const handleAddMember = (user: {
        id: string;
        displayName?: string | null;
        name?: string | null;
        email?: string | null;
        phoneNumber?: string | null;
        profileColor?: string | null;
    }) => {
        setEditorData((previous) => {
            if (previous.members.some((member) => member.userId === user.id)) {
                return previous;
            }

            return {
                ...previous,
                members: [
                    ...previous.members,
                    {
                        userId: user.id,
                        displayName: user.displayName ?? undefined,
                        name: user.name ?? undefined,
                        email: user.email ?? undefined,
                        phoneNumber: user.phoneNumber ?? undefined,
                        profileColor: user.profileColor ?? undefined,
                        role: 'Thành viên',
                    },
                ],
            };
        });
        setMemberSearch('');
        setMemberSuggestions([]);
    };

    const handleRemoveMember = (userId: string) => {
        setEditorData((previous) => ({
            ...previous,
            members: previous.members.filter((member) => member.userId !== userId),
        }));
    };

    const handleUpdateMemberRole = (userId: string, role: string) => {
        setEditorData((previous) => ({
            ...previous,
            members: previous.members.map((member) =>
                member.userId === userId ? { ...member, role } : member
            ),
        }));
    };

    const handleSubmitEditor = async () => {
        if (!token) {
            navigate('/login');
            return;
        }

        if (editorMode === 'edit' && !editingTeamId) {
            setEditorError('Không xác định được bài đăng để cập nhật.');
            return;
        }

        setEditorSaving(true);
        setEditorError(null);

        if (editorMode === 'edit' && user) {
            const editingPost = teamPosts.find((post) => post.id === (editingTeamId ?? selectedTeam?.id));
            const ownerId = editingPost?.owner.id ?? selectedTeam?.owner.id;
            if (ownerId && ownerId !== user.id) {
                setEditorSaving(false);
                setEditorPrefilling(false);
                setEditorOpen(false);
                setEditorError('Bạn chỉ có thể lưu bài đăng của chính mình.');
                return;
            }
        }

        try {
            const payload = {
                ...editorData,
                maxMembers: Math.max(1, Number(editorData.maxMembers) || 1),
                tags: editorData.tags,
                members: editorData.members.map((member) => ({
                    userId: member.userId,
                    role: member.role || 'Thành viên',
                })),
            };

            const endpoint =
                editorMode === 'create'
                    ? `${API_BASE_URL}/community/team-posts`
                    : `${API_BASE_URL}/community/team-posts/${editingTeamId}`;

            const response = await fetch(endpoint, {
                method: editorMode === 'create' ? 'POST' : 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                const data = await response.json();
                const detail = mapTeamDetail(data.team);

                setToastMessage(editorMode === 'create' ? 'Đã tạo bài đăng mới.' : 'Đã cập nhật bài đăng.');
                setShowToast(true);
                setEditorOpen(false);
                setEditorData(emptyFormState);
                setEditingTeamId(null);

                await fetchTeamPosts();
                setSelectedTeam((current) => (current && current.id === detail.id ? detail : current));
            } else {
                const payload = await response.json().catch(() => ({}));
                setEditorError(payload.message ?? 'Không thể lưu bài đăng, vui lòng thử lại.');
            }
        } catch (error) {
            console.error('Save team post error:', error);
            setEditorError('Không thể lưu bài đăng, vui lòng thử lại.');
        } finally {
            setEditorSaving(false);
            setEditorPrefilling(false);
        }
    };

    const closeTeamDetail = () => {
        setSelectedTeam(null);
        setTeamSuggestions([]);
    };

    const normalizedQuery = searchQuery.trim().toLowerCase();

    const ownedTeamPosts = useMemo(
        () => (user ? teamPosts.filter((post) => post.owner.id === user.id) : []),
        [teamPosts, user?.id]
    );

    const filteredTeamPosts = useMemo(() => {
        if (!normalizedQuery) {
            return teamPosts;
        }

        return teamPosts.filter((post) => {
            const combined =
                `${post.title} ${post.teamName ?? ''} ${post.summary} ${(post.tags ?? []).join(' ')} ${post.lookingFor ?? ''
                    }`.toLowerCase();
            return combined.includes(normalizedQuery);
        });
    }, [teamPosts, normalizedQuery]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 text-gray-900">
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white py-16">
                <div className="max-w-6xl mx-auto px-6 lg:px-12">
                    <p className="text-sm font-semibold uppercase tracking-[0.4em] text-indigo-200/80 mb-3">
                        Cộng đồng ContestHub
                    </p>
                    <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
                        Kết nối nhanh – Tìm đồng đội phù hợp với hành trình thi đấu của bạn.
                    </h1>
                    <p className="mt-4 text-indigo-100 text-lg max-w-2xl">
                        Chọn nhóm đang tìm thành viên và bắt đầu hợp tác ngay. Giao diện mới tinh gọn,
                        nhanh gọn.
                    </p>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 lg:px-12 -mt-12 pb-24 space-y-10">
                {/* Thanh gợi ý đồng đội ăn ý */}
                <TeammateRecommendation token={token} />

                <div className="bg-white shadow-xl rounded-3xl p-6 md:p-8">
                    <div className="flex-1 relative">
                        <Search className="w-5 h-5 text-gray-400 absolute top-1/2 left-4 -translate-y-1/2" />
                        <input
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                            placeholder="Tìm nhóm, kỹ năng, thẻ tag..."
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                        />
                    </div>
                </div>

                {user && (
                    <div className="bg-white border border-indigo-50 shadow rounded-3xl p-6 space-y-4">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                            <p className="text-sm text-gray-500">Bài viết của bạn</p>
                            <h3 className="text-lg font-semibold text-gray-900">
                                {ownedTeamPosts.length > 0 ? "Đang mở bài tuyển thành viên" : "Chưa có bài đăng tìm thành viên"}
                            </h3>
                        </div>
                            <button
                                type="button"
                                onClick={(event) => {
                                    event.preventDefault();
                                    openCreateEditor();
                                }}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-indigo-600 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 font-semibold"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Thêm bài</span>
                            </button>
                        </div>
                        {ownedTeamPosts.length > 0 ? (
                            <div className="grid md:grid-cols-2 gap-3">
                                {ownedTeamPosts.map((post) => (
                                    <div
                                        key={post.id}
                                        className="border border-gray-100 rounded-2xl p-4 flex flex-col gap-3 bg-gray-50/70"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="space-y-1">
                                                <p className="text-sm font-semibold text-gray-800 line-clamp-2">{post.title}</p>
                                                <p className="text-xs text-gray-500 line-clamp-2">{post.summary}</p>
                                            </div>
                                            <button
                                                onClick={() => openEditEditor(post.id)}
                                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white text-indigo-600 border border-indigo-100 shadow-sm hover:shadow"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                                <span className="text-xs font-semibold">Chỉnh sửa</span>
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-gray-500">
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white border border-gray-200">
                                                <Users className="w-3 h-3 text-indigo-500" />
                                                {post.activeMemberCount}/{post.maxMembers}
                                            </span>
                                            <span
                                                className={`px-2 py-1 rounded-full font-semibold ${post.status === "OPEN"
                                                    ? "bg-emerald-50 text-emerald-600"
                                                    : post.status === "FULL"
                                                        ? "bg-amber-50 text-amber-600"
                                                        : "bg-gray-100 text-gray-600"
                                                    }`}
                                            >
                                                {post.status === "OPEN" ? "Đang mở" : post.status === "FULL" ? "Đã đủ" : "Đã đóng"}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">Đăng bài ngay để ghép thành viên phù hợp từ cộng đồng.</p>
                        )}
                    </div>
                )}
                <section className="space-y-6">
                    <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Thông tin tìm đồng đội</h2>
                            <p className="text-gray-500">
                                Công cụ giúp bạn kết nối nhanh với nhóm đang cần kỹ năng của bạn. Mọi thông tin
                                liên lạc sẽ được đồng bộ với nhóm.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-3 py-1 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-full">
                                {teamPosts.length} tin đăng
                            </span>
                            <button
                                type="button"
                                onClick={(event) => {
                                    event.preventDefault();
                                    openCreateEditor();
                                }}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 shadow hover:shadow-lg hover:-translate-y-0.5 transition"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Đăng bài mới</span>
                            </button>
                        </div>
                    </header>

                    {teamsLoading ? (
                        <div className="bg-white rounded-3xl shadow p-10 flex flex-col items-center gap-4 text-gray-500">
                            <div className="flex gap-2">
                                <div className="h-3 w-3 bg-indigo-500 rounded-full animate-bounce"></div>
                                <div className="h-3 w-3 bg-purple-500 rounded-full animate-bounce [animation-delay:150ms]"></div>
                                <div className="h-3 w-3 bg-pink-500 rounded-full animate-bounce [animation-delay:300ms]"></div>
                            </div>
                            <p>Đang tải danh sách nhóm...</p>
                        </div>
                    ) : filteredTeamPosts.length === 0 ? (
                        <div className="bg-white rounded-3xl shadow p-12 text-center text-gray-500">
                            <UserPlus className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">Chưa có nhóm phù hợp</h3>
                            <p>Thử đổi từ khóa tìm kiếm hoặc quay lại sau để xem các nhóm mới.</p>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-6">
                            {filteredTeamPosts.map((post) => {
                                const canEdit = Boolean(user && post.owner?.id && user.id === post.owner.id);
                                return (
                                    <article
                                    key={post.id}
                                    onClick={() => fetchTeamDetail(post.id)}
                                    className="bg-white rounded-3xl border border-gray-100 shadow hover:shadow-xl transition-all duration-300 cursor-pointer group p-6 flex flex-col gap-5"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="space-y-2">
                                            <div className="flex flex-wrap gap-2">
                                                {post.tags.slice(0, 3).map((tag) => (
                                                    <span
                                                        key={tag}
                                                        className="inline-flex items-center gap-1 text-xs font-semibold bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full"
                                                    >
                                                        <Tag className="w-3 h-3" />
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition">
                                                {post.title}
                                            </h3>
                                            <p className="text-sm text-gray-500 line-clamp-3">{post.summary}</p>
                                        </div>
                                        <div className="flex items-center justify-end gap-2 flex-wrap">
                                            {canEdit && (
                                                <button
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        openEditEditor(post.id);
                                                    }}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-indigo-100 text-indigo-600 shadow-sm hover:shadow-md text-sm font-medium whitespace-nowrap"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                    <span>Chỉnh sửa</span>
                                                </button>
                                            )}
                                            <button
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    if (!post.isMember) {
                                                        handleJoinTeam(post.id);
                                                    }
                                                }}
                                                disabled={post.isMember || joiningTeamId === post.id}
                                                className={`inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition ${post.isMember
                                                    ? 'bg-emerald-50 text-emerald-600 cursor-default'
                                                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm hover:shadow-md hover:scale-[1.01]'
                                                    } ${joiningTeamId === post.id ? 'opacity-70 pointer-events-none' : ''}`}
                                            >
                                                {post.isMember
                                                    ? 'Đã tham gia'
                                                    : joiningTeamId === post.id
                                                        ? 'Đang xử lý...'
                                                        : 'Tham gia'}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                        <span className="flex items-center gap-2">
                                            <Users className="w-4 h-4 text-indigo-500" />
                                            {post.activeMemberCount}/{post.maxMembers} thành viên
                                        </span>
                                        {post.lookingFor && (
                                            <span className="flex items-center gap-2">
                                                <UserPlus className="w-4 h-4 text-purple-500" />
                                                {post.lookingFor}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                                        <div
                                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                                            style={{ backgroundColor: post.owner.profileColor ?? '#4f46e5' }}
                                        >
                                            {(post.owner.displayName || post.owner.name || 'N')[0]}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900">
                                                {post.owner.displayName || post.owner.name || 'Thành viên'}
                                            </p>
                                            <p className="text-xs text-gray-500">Trưởng nhóm • Kết nối nhanh</p>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                        </div>
                    )}
                </section>
            </div>
            {showToast && (
                <CuteToast
                    message={toastMessage}
                    onClose={() => setShowToast(false)}
                    icon="sparkles"
                    duration={4000}
                />
            )}

            {editorOpen && (
                <TeamPostEditorModal
                    mode={editorMode}
                    data={editorData}
                    saving={editorSaving}
                    prefilling={editorPrefilling}
                    error={editorError}
                    onClose={() => {
                        setEditorOpen(false);
                        setEditorError(null);
                        setMemberSearch('');
                        setMemberSuggestions([]);
                    }}
                    onChange={handleEditorFieldChange}
                    onAddTag={handleAddTag}
                    onRemoveTag={handleRemoveTag}
                    onSubmit={handleSubmitEditor}
                    memberSearch={memberSearch}
                    memberSuggestions={memberSuggestions}
                    memberSearching={memberSearching}
                    onSearchMember={handleMemberSearch}
                    onAddMember={handleAddMember}
                    onRemoveMember={handleRemoveMember}
                    onUpdateMemberRole={handleUpdateMemberRole}
                />
            )}

            {selectedTeam && (
                <TeamDetailModal
                    team={selectedTeam}
                    suggestions={teamSuggestions}
                    onClose={closeTeamDetail}
                    onJoin={() => handleJoinTeam(selectedTeam.id)}
                    joining={joiningTeamId === selectedTeam.id}
                    onOpenSuggestion={(teamId) => fetchTeamDetail(teamId)}
                    canEdit={Boolean(user?.id && selectedTeam.owner.id && user.id === selectedTeam.owner.id)}
                    onEdit={() => openEditEditor(selectedTeam.id)}
                />
            )}
        </div>
    );
};

interface TeamPostEditorModalProps {
    mode: 'create' | 'edit';
    data: TeamPostFormState;
    saving: boolean;
    prefilling: boolean;
    error?: string | null;
    onClose: () => void;
    onChange: (field: keyof TeamPostFormState, value: string | number | string[]) => void;
    onAddTag: (tag: string) => void;
    onRemoveTag: (tag: string) => void;
    onSubmit: () => void;
    memberSearch: string;
    memberSuggestions: {
        id: string;
        displayName?: string | null;
        name?: string | null;
        email?: string | null;
        phoneNumber?: string | null;
        profileColor?: string | null;
    }[];
    memberSearching: boolean;
    onSearchMember: (value: string) => void;
    onAddMember: (user: {
        id: string;
        displayName?: string | null;
        name?: string | null;
        email?: string | null;
        phoneNumber?: string | null;
        profileColor?: string | null;
    }) => void;
    onRemoveMember: (userId: string) => void;
    onUpdateMemberRole: (userId: string, role: string) => void;
}

const TeamPostEditorModal: React.FC<TeamPostEditorModalProps> = ({
    mode,
    data,
    saving,
    prefilling,
    error,
    onClose,
    onChange,
    onAddTag,
    onRemoveTag,
    onSubmit,
    memberSearch,
    memberSuggestions,
    memberSearching,
    onSearchMember,
    onAddMember,
    onRemoveMember,
    onUpdateMemberRole,
}) => {
    const [tagInput, setTagInput] = useState('');

    useEffect(() => {
        setTagInput('');
    }, [mode, data.title, data.summary]);

    const handleTagAdd = () => {
        if (!tagInput.trim()) return;
        onAddTag(tagInput);
        setTagInput('');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500">
                            {mode === 'create' ? 'Tạo bài đăng mới' : 'Chỉnh sửa bài đăng'}
                        </p>
                        <h3 className="text-xl font-bold text-gray-900">
                            {data.title || 'Bài đăng tìm thành viên'}
                        </h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <button
                            onClick={onSubmit}
                            disabled={saving || prefilling}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold shadow hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            <span>{mode === 'create' ? 'Lưu & đăng' : 'Cập nhật bài đăng'}</span>
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-5 relative">
                    {prefilling && (
                        <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                            <Loader2 className="w-7 h-7 text-indigo-600 animate-spin" />
                        </div>
                    )}

                    {error && (
                        <div className="p-3 rounded-lg bg-rose-50 text-rose-600 border border-rose-100 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-semibold text-gray-700">Tiêu đề</label>
                            <input
                                value={data.title}
                                onChange={(event) => onChange('title', event.target.value)}
                                placeholder="Ví dụ: Tìm CTO đồng sáng lập startup"
                                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Tên nhóm</label>
                            <input
                                value={data.teamName}
                                onChange={(event) => onChange('teamName', event.target.value)}
                                placeholder="Tên nhóm hoặc công ty"
                                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Vị trí/Nơi làm việc</label>
                            <input
                                value={data.location}
                                onChange={(event) => onChange('location', event.target.value)}
                                placeholder="Hà Nội, HCM, Remote"
                                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Tóm tắt ngắn</label>
                            <textarea
                                value={data.summary}
                                onChange={(event) => onChange('summary', event.target.value)}
                                rows={3}
                                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                placeholder="Mô tả nhanh ý tưởng và lý do cần thêm thành viên."
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Đang tìm</label>
                            <textarea
                                value={data.lookingFor}
                                onChange={(event) => onChange('lookingFor', event.target.value)}
                                rows={3}
                                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                placeholder="Ví dụ: 1 marketer, 1 frontend engineer, ... "
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-semibold text-gray-700">Mô tả chi tiết</label>
                            <textarea
                                value={data.description}
                                onChange={(event) => onChange('description', event.target.value)}
                                rows={4}
                                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                placeholder="Chia sẻ về sản phẩm, giai đoạn hiện tại, lộ trình phát triển, điểm thu hút."
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Yêu cầu</label>
                            <textarea
                                value={data.requirements}
                                onChange={(event) => onChange('requirements', event.target.value)}
                                rows={3}
                                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                placeholder="Kỹ năng bắt buộc, cam kết thời gian, công cụ sử dụng..."
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Số lượng thành viên tối đa</label>
                            <input
                                type="number"
                                min={1}
                                value={data.maxMembers}
                                onChange={(event) => onChange('maxMembers', Number(event.target.value))}
                                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Trạng thái</label>
                            <select
                                value={data.status}
                                onChange={(event) => onChange('status', event.target.value as TeamRecruitmentStatus)}
                                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                            >
                                <option value="OPEN">Đang mở</option>
                                <option value="FULL">Đã đủ</option>
                                <option value="CLOSED">Đã đóng</option>
                            </select>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-semibold text-gray-700">Tag kỹ năng</label>
                            <div className="flex items-center gap-2">
                                <input
                                    value={tagInput}
                                    onChange={(event) => setTagInput(event.target.value)}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter' || event.key === ',') {
                                            event.preventDefault();
                                            handleTagAdd();
                                        }
                                    }}
                                    placeholder="Thêm tag và nhấn Enter"
                                    className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                <button
                                    onClick={handleTagAdd}
                                    className="px-3 py-3 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100"
                                    type="button"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {data.tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm"
                                    >
                                        <Tag className="w-4 h-4" />
                                        {tag}
                                        <button
                                            type="button"
                                            onClick={() => onRemoveTag(tag)}
                                            className="text-gray-500 hover:text-gray-800"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-semibold text-gray-700">
                                    Thành viên đang hoạt động
                                </label>
                                <span className="text-xs text-gray-500">
                                    {data.members.length + 1}/{Math.max(data.maxMembers, data.members.length + 1)}{' '}
                                    thành viên (bao gồm bạn)
                                </span>
                            </div>
                            <div className="relative">
                                <input
                                    value={memberSearch}
                                    onChange={(event) => onSearchMember(event.target.value)}
                                    placeholder="Gõ tên hoặc email để thêm thành viên"
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                {memberSearching && (
                                    <Loader2 className="w-4 h-4 animate-spin text-indigo-500 absolute right-3 top-1/2 -translate-y-1/2" />
                                )}
                                {memberSuggestions.length > 0 && (
                                    <div className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-auto">
                                        {memberSuggestions.map((user) => (
                                            <button
                                                key={user.id}
                                                type="button"
                                                onClick={() => onAddMember(user)}
                                                className="w-full text-left px-4 py-3 hover:bg-indigo-50 flex items-center gap-3"
                                            >
                                                <div
                                                    className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold"
                                                    style={{ backgroundColor: user.profileColor ?? '#4f46e5' }}
                                                >
                                                    {(user.displayName || user.name || user.email || 'N')[0]}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-semibold text-gray-800">
                                                        {user.displayName || user.name || 'Không rõ tên'}
                                                    </p>
                                                    <p className="text-xs text-gray-500">{user.email}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {data.members.length > 0 ? (
                                <div className="space-y-3">
                                    {data.members.map((member) => (
                                        <div
                                            key={member.userId}
                                            className="border border-gray-100 rounded-2xl p-4 flex items-start gap-3 bg-gray-50/50"
                                        >
                                            <div
                                                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                                                style={{ backgroundColor: member.profileColor ?? '#6366f1' }}
                                            >
                                                {(member.displayName || member.name || 'N')[0]}
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <p className="text-sm font-semibold text-gray-900">
                                                    {member.displayName || member.name || 'Không rõ tên'}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {member.email || 'Email chưa cập nhật'}
                                                </p>
                                                {member.phoneNumber && (
                                                    <p className="text-xs text-gray-500">Số liên lạc: {member.phoneNumber}</p>
                                                )}
                                                <input
                                                    value={member.role}
                                                    onChange={(event) => onUpdateMemberRole(member.userId, event.target.value)}
                                                    className="mt-2 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                    placeholder="Vai trò trong nhóm"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => onRemoveMember(member.userId)}
                                                className="text-gray-400 hover:text-rose-500"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">Thêm thành viên để hiển thị thông tin liên lạc rõ ràng.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface TeamDetailModalProps {
    team: TeamPostDetail;
    suggestions: TeamPostSummary[];
    joining: boolean;
    onJoin: () => void;
    onClose: () => void;
    onOpenSuggestion: (teamId: string) => void;
    onEdit?: () => void;
    canEdit?: boolean;
}

const TeamDetailModal: React.FC<TeamDetailModalProps> = ({
    team,
    suggestions,
    joining,
    onJoin,
    onClose,
    onOpenSuggestion,
    onEdit,
    canEdit,
}) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <header className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 flex justify-between items-start gap-4">
                    <div>
                        <p className="text-sm text-indigo-200 uppercase tracking-[0.3em] mb-2">Thông tin chi tiết</p>
                        <h2 className="text-2xl font-semibold">{team.title}</h2>
                        <div className="flex items-center gap-3 mt-3 text-sm text-indigo-100">
                            <div
                                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                                style={{ backgroundColor: team.owner.profileColor ?? '#4f46e5' }}
                            >
                                {(team.owner.displayName || team.owner.name || 'N')[0]}
                            </div>
                            <div>
                                <p className="font-semibold text-white">
                                    {team.owner.displayName || team.owner.name || 'Trưởng nhóm'}
                                </p>
                                <p className="text-xs text-indigo-100/80">Người tạo bài đăng</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                        {canEdit && (
                            <button
                                onClick={onEdit}
                                className="px-4 py-2 rounded-xl border border-white/30 text-white hover:bg-white/10 transition"
                            >
                                Chỉnh sửa
                            </button>
                        )}
                        <button
                            onClick={onJoin}
                            disabled={team.isMember || joining}
                            className={`px-5 py-2 rounded-xl font-semibold transition ${team.isMember
                                ? 'bg-emerald-50 text-emerald-600 cursor-default'
                                : 'bg-white text-indigo-600 hover:bg-indigo-50'
                                } ${joining ? 'opacity-70 pointer-events-none' : ''}`}
                        >
                            {team.isMember ? 'Đã tham gia' : joining ? 'Đang xử lý...' : 'Tham gia nhóm'}
                        </button>
                        <button
                            onClick={onClose}
                            className="px-3 py-2 rounded-xl text-white/80 hover:bg-white/10 transition"
                        >
                            Đóng
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto">
                    <div className="p-6 space-y-8">
                        <section className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-widest">
                                        Tổng quan
                                    </h3>
                                    <p className="text-gray-700 mt-2 leading-relaxed">{team.description}</p>
                                </div>
                                {team.lookingFor && (
                                    <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 space-y-2">
                                        <h4 className="text-sm font-semibold text-indigo-600 uppercase tracking-widest">
                                            Nhóm đang tìm
                                        </h4>
                                        <p className="text-sm text-indigo-700">{team.lookingFor}</p>
                                    </div>
                                )}
                                {team.requirements && (
                                    <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 space-y-2">
                                        <h4 className="text-sm font-semibold text-purple-600 uppercase tracking-widest">
                                            Yêu cầu
                                        </h4>
                                        <p className="text-sm text-purple-700">{team.requirements}</p>
                                    </div>
                                )}
                                <div className="flex flex-wrap gap-2">
                                    {team.tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-medium"
                                        >
                                            <Tag className="w-3 h-3" />
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
                                    <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-widest mb-3">
                                        Vị trí & thông tin liên lạc
                                    </h4>
                                    <div className="space-y-3 text-sm text-gray-600">
                                        {team.location && (
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-rose-500" />
                                                <span>{team.location}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2">
                                            <Mail className="w-4 h-4 text-indigo-500" />
                                            <span>{team.owner.email || 'Email chưa cập nhật'}</span>
                                        </div>
                                        {team.members
                                            .filter((member) => member.user.email && member.userId === team.owner.id)
                                            .map((member) =>
                                                member.user.phoneNumber ? (
                                                    <div key={member.id} className="flex items-center gap-2">
                                                        <Phone className="w-4 h-4 text-green-500" />
                                                        <span>{member.user.phoneNumber}</span>
                                                    </div>
                                                ) : null
                                            )}
                                    </div>
                                </div>

                                <div className="bg-white border border-gray-100 rounded-2xl p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-widest">
                                            Thành viên đang hoạt động
                                        </h4>
                                        <span className="text-xs text-gray-400">
                                            {team.activeMemberCount}/{team.maxMembers}
                                        </span>
                                    </div>
                                    <ul className="space-y-3">
                                        {team.members.map((member) => (
                                            <li key={member.id} className="flex items-start gap-3">
                                                <div
                                                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                                                    style={{
                                                        backgroundColor: member.user.profileColor ?? '#6366f1',
                                                    }}
                                                >
                                                    {(member.user.displayName || member.user.name || 'N')[0]}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-semibold text-gray-800">
                                                        {member.user.displayName || member.user.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {member.role || 'Thành viên'} • {member.user.email || 'Email không có'}
                                                    </p>
                                                    {member.user.phoneNumber && (
                                                        <p className="text-xs text-gray-500">Số liên lạc: {member.user.phoneNumber}</p>
                                                    )}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </section>

                        {suggestions.length > 0 && (
                            <section className="space-y-3">
                                <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-widest">
                                    Gợi ý nhóm khác cùng thẻ tag
                                </h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    {suggestions.slice(0, 4).map((suggestion) => (
                                        <button
                                            key={suggestion.id}
                                            onClick={() => onOpenSuggestion(suggestion.id)}
                                            className="text-left bg-gray-50 border border-gray-100 hover:border-indigo-200 hover:bg-white rounded-2xl p-4 transition"
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-800">
                                                        {suggestion.title}
                                                    </p>
                                                    <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                                                        {suggestion.summary}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-1 text-xs text-gray-400">
                                                    <Users className="w-3 h-3 text-indigo-500" />
                                                    {suggestion.activeMemberCount}/{suggestion.maxMembers}
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                {suggestion.tags.slice(0, 2).map((tag) => (
                                                    <span
                                                        key={tag}
                                                        className="inline-flex items-center gap-1 bg-white border border-gray-200 text-gray-500 px-2 py-1 rounded-full text-[11px] font-medium"
                                                    >
                                                        <Tag className="w-3 h-3" />
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommunityPage;
