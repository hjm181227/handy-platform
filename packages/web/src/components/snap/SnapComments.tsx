import { useState, useEffect } from 'react';
import { webApiService } from '../../services/apiService';

interface SnapCommentsProps {
  snapUuid: string;
}

export default function SnapComments({ snapUuid }: SnapCommentsProps) {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<{ uuid: string; nickname: string } | null>(null);

  useEffect(() => {
    fetchComments();
  }, [snapUuid]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await webApiService.snap.getComments(snapUuid);
      if (response.success) {
        setComments(response.data?.comments || []);
      }
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    try {
      setSubmitting(true);
      const data: { content: string; parentCommentUuid?: string } = {
        content: newComment.trim(),
      };
      if (replyTo) {
        data.parentCommentUuid = replyTo.uuid;
      }

      await webApiService.snap.createComment(snapUuid, data);
      setNewComment('');
      setReplyTo(null);
      fetchComments();
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentUuid: string) => {
    try {
      await webApiService.snap.deleteComment(snapUuid, commentUuid);
      setComments(prev => prev.filter(c => c.commentUuid !== commentUuid));
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    return date.toLocaleDateString('ko-KR');
  };

  // 댓글을 스레드로 그룹화
  const rootComments = comments.filter(c => !c.parentCommentUuid);
  const replies = comments.filter(c => c.parentCommentUuid);
  const getReplies = (parentUuid: string) => replies.filter(r => r.parentCommentUuid === parentUuid);

  const renderComment = (comment: any, isReply = false) => (
    <div key={comment.commentUuid} className={`flex gap-2 ${isReply ? 'ml-8 mt-2' : 'mt-3'}`}>
      {comment.author?.avatar ? (
        <img src={comment.author.avatar} className="w-7 h-7 rounded-full flex-shrink-0" alt="" />
      ) : (
        <div className="w-7 h-7 rounded-full bg-gray-200 flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-semibold text-gray-900">
            {comment.author?.nickname || comment.author?.name || ''}
          </span>
          <span className="text-[10px] text-gray-400">{formatTime(comment.createdAt)}</span>
        </div>
        <p className="text-sm text-gray-700 mt-0.5">{comment.content}</p>
        <div className="flex gap-3 mt-1">
          <button
            onClick={() => setReplyTo({ uuid: comment.commentUuid, nickname: comment.author?.nickname || '' })}
            className="text-[10px] text-gray-400 hover:text-gray-600"
          >
            답글
          </button>
          {comment.isOwner && (
            <button
              onClick={() => handleDelete(comment.commentUuid)}
              className="text-[10px] text-gray-400 hover:text-red-500"
            >
              삭제
            </button>
          )}
        </div>
        {/* 답글 렌더링 */}
        {getReplies(comment.commentUuid).map(reply => renderComment(reply, true))}
      </div>
    </div>
  );

  return (
    <div className="mb-4 border-t border-b py-3">
      {/* 댓글 목록 */}
      <div className="max-h-60 overflow-y-auto">
        {loading ? (
          <div className="text-center py-4">
            <div className="inline-block w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          </div>
        ) : rootComments.length === 0 ? (
          <p className="text-center text-xs text-gray-400 py-4">아직 댓글이 없습니다.</p>
        ) : (
          rootComments.map(c => renderComment(c))
        )}
      </div>

      {/* 댓글 입력 */}
      <form onSubmit={handleSubmit} className="mt-3">
        {replyTo && (
          <div className="flex items-center gap-2 mb-1.5 text-xs text-[#E85A6B]">
            <span>@{replyTo.nickname}에게 답글</span>
            <button type="button" onClick={() => setReplyTo(null)} className="text-gray-400 hover:text-gray-600">
              ✕
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="댓글을 입력하세요..."
            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-full focus:outline-none focus:border-blue-400"
          />
          <button
            type="submit"
            disabled={!newComment.trim() || submitting}
            className="px-4 py-2 bg-[#E85A6B] text-white text-sm rounded-full hover:bg-[#D14A5B] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? '...' : '게시'}
          </button>
        </div>
      </form>
    </div>
  );
}
