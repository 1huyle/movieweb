import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../config/axios';
import YouTube from 'react-youtube';
import MovieCard from '../../components/MovieCard/MovieCard';
import useUser from '../../hooks/useUser';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import Login from '../../components/Modal/Login';
import { formatRelativeTime } from "../../utils/dateUtils";
import { useFavorite } from '../../context/FavoriteContext';
import { FaStar, FaHeart, FaRegHeart, FaEye, FaClock } from 'react-icons/fa';

const MovieDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const { isFavorite, addFavorite, removeFavorite, loading: favoriteLoading } = useFavorite();
  const [season, setSeason] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [related, setRelated] = useState([]);
  const [editingComment, setEditingComment] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingReply, setEditingReply] = useState(null);
  const [editReplyContent, setEditReplyContent] = useState('');
  const [ratingLoading, setRatingLoading] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [seasonRes, commentsRes, relatedRes] = await Promise.all([
          axios.get(`/api/season/${id}`),
          axios.get(`/api/season/${id}/comments?page=${page}`).catch(() => ({ data: [] })),
          axios.get(`/api/season/${id}/related`).catch(() => ({ data: [] }))
        ]);

        console.log('Season data received:', seasonRes.data);
        console.log('MovieActors:', seasonRes.data.MovieActors);
        console.log('MovieCrews:', seasonRes.data.MovieCrews);
        
        setSeason(seasonRes.data);

        // Group comment cha và reply
        const commentMap = {};
        const parents = [];
        commentsRes.data.forEach(c => {
          c.replies = [];
          commentMap[c.id] = c;
        });
        commentsRes.data.forEach(c => {
          if (c.parentId) {
            if (commentMap[c.parentId]) {
              commentMap[c.parentId].replies.push(c);
            }
          } else {
            parents.push(c);
          }
        });

        if (page === 1) {
          setComments(parents);
        } else {
          setComments(prev => [...prev, ...parents]);
        }
        setHasMore(commentsRes.data.length === 10); // Assuming 10 comments per page
        setRelated(relatedRes.data);
        setLoading(false);
      } catch (err) {
        setError('Không thể tải thông tin phim');
        setLoading(false);
      }
    };
    fetchData();
  }, [id, page]);
  useEffect(() => {
    if (user && season) {
      axios
        .get(`/api/rating/${season.id}`)
        .then(res => setUserRating(res.data?.rating || 0))
        .catch(() => setUserRating(0));
    }
  }, [user, season]);
  const handleRate = async (value) => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    setRatingLoading(true);
    try {
      await axios.post(`/api/rating/${season.id}`, { rating: value });
      setUserRating(value);
      setMessage({ type: 'success', text: 'Đánh giá thành công!' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Không thể đánh giá' });
    }
    setRatingLoading(false);
  };
  const getYouTubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url?.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    try {
      const response = await axios.post(`/api/comment/season/${id}`, {
        content: newComment
      });
      // Đảm bảo comment mới có replies là mảng rỗng
      setComments([{ ...response.data, replies: [] }, ...comments]);
      setNewComment('');
      setMessage({ type: 'success', text: 'Bình luận đã được đăng' });
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Không thể đăng bình luận' 
      });
    }
  };
  const handleReplySubmit = async (parentId) => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    try {
      const response = await axios.post(`/api/comment/${parentId}/reply`, {
        content: replyContent,
      });
      // Đảm bảo reply có User (nếu backend không trả về)
      const replyData = {
        ...response.data,
        User: response.data.User || user,
      };
      setComments(comments =>
        comments.map(comment =>
          comment.id === parentId
            ? { ...comment, replies: [replyData, ...(comment.replies || [])] }
            : comment
        )
      );
      setReplyingTo(null);
      setReplyContent('');
      setMessage({ type: 'success', text: 'Đã trả lời bình luận' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Không thể gửi trả lời' });
    }
  };
  const handleEditComment = async (commentId) => {
    try {
      const response = await axios.put(`/api/comment/${commentId}`, {
        content: editContent
      });
      setComments(comments.map(comment => 
        comment.id === commentId
          ? { ...response.data, replies: comment.replies } // Giữ lại replies cũ
          : comment
      ));
      setEditingComment(null);
      setEditContent('');
      setMessage({ type: 'success', text: 'Bình luận đã được cập nhật' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Không thể cập nhật bình luận' });
    }
  };
  const handleEditReply = async (replyId, parentId) => {
    try {
      const response = await axios.put(`/api/comment/${replyId}`, {
        content: editReplyContent
      });
      setComments(comments =>
        comments.map(comment =>
          comment.id === parentId
            ? {
                ...comment,
                replies: comment.replies.map(reply =>
                  reply.id === replyId ? response.data : reply
                )
              }
            : comment
        )
      );
      setEditingReply(null);
      setEditReplyContent('');
      setMessage({ type: 'success', text: 'Đã sửa trả lời' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Không thể sửa trả lời' });
    }
  };
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Bạn có chắc muốn xóa bình luận này?')) return;
    try {
      await axios.delete(`/api/comment/${commentId}`);
      setComments(comments.filter(comment => comment.id !== commentId));
      setMessage({ type: 'success', text: 'Bình luận đã được xóa' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Không thể xóa bình luận' });
    }
  };
  const handleDeleteReply = async (replyId, parentId) => {
    if (!window.confirm('Bạn có chắc muốn xóa trả lời này?')) return;
    try {
      await axios.delete(`/api/comment/${replyId}`);
      setComments(comments =>
        comments.map(comment =>
          comment.id === parentId
            ? { ...comment, replies: comment.replies.filter(reply => reply.id !== replyId) }
            : comment
        )
      );
      setMessage({ type: 'success', text: 'Trả lời đã được xóa' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Không thể xóa trả lời' });
    }
  };
  const loadMoreComments = () => {
    setPage(prev => prev + 1);
  };

  const handleFavoriteClick = async () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    try {
      if (isFavorite(season.id)) {
        await removeFavorite(season.id);
        setMessage({ type: 'success', text: 'Đã xóa khỏi danh sách yêu thích' });
      } else {
        await addFavorite(season.id);
        setMessage({ type: 'success', text: 'Đã thêm vào danh sách yêu thích' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Không thể thực hiện thao tác' });
    }
  };

  if (loading) return (
    <>
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    </>
  );

  if (error) return (
    <>
      <div className="text-center text-red-500 p-4">{error}</div>
    </>
  );

  return (
    <>
      <div className="min-h-screen bg-gray-900 text-white">
        {/* Hero Section with Trailer */}
        <div className="relative h-[50vh]">
          {season?.trailer_url && (
            <YouTube
              videoId={getYouTubeId(season.trailer_url)}
              className="absolute w-full h-full"
              opts={{
                width: "100%",
                height: "100%",
                playerVars: {
                  autoplay: 1,
                  controls: 1,
                  modestbranding: 1,
                  showinfo: 0,
                  rel: 0,
                },
              }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent"></div>
        </div>

        {/* Content Section */}
        <div className="container mx-auto px-4 -mt-20 relative z-10">
          {/* Thông tin tổng quan và danh sách tập phim */}
          <div className="flex flex-col md:flex-row gap-8 mb-8">
            {/* Poster */}
            <div className="md:w-1/4 flex-shrink-0">
              <div className="relative w-full" style={{ paddingTop: '150%' }}>
                <img
                  src={season?.poster_url}
                  alt={season?.title}
                  className="absolute top-0 left-0 w-full h-full object-cover rounded-lg shadow-lg"
                />
              </div>
            </div>

            {/* Thông tin chi tiết và danh sách tập phim */}
            <div className="md:w-3/4">
              {/* Thông tin chi tiết */}
              <div className="mb-8">
                <h1 className="text-4xl md:text-5xl font-extrabold mb-2 drop-shadow-lg">
                  {season?.Movie?.title || season?.title} <span className="text-gray-400 font-bold">- {season?.release_date ? new Date(season.release_date).getFullYear() : ''}</span>
                </h1>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-gray-800 p-4 rounded-xl text-center shadow-lg">
                    <FaEye className="w-6 h-6 mx-auto mb-2 text-blue-400" />
                    <div className="text-sm text-gray-300">Lượt xem</div>
                    <div className="font-bold text-xl">{season?.viewCount || 0}</div>
                  </div>
                  <div className="bg-gray-800 p-4 rounded-xl text-center shadow-lg">
                    <FaHeart className="w-6 h-6 mx-auto mb-2 text-pink-400" />
                    <div className="text-sm text-gray-300">Yêu thích</div>
                    <div className="font-bold text-xl">{season?.favoriteCount || 0}</div>
                  </div>
                  <div className="bg-gray-800 p-4 rounded-xl text-center shadow-lg">
                    <FaStar className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
                    <div className="text-sm text-gray-300">Điểm</div>
                    <div className="font-bold text-xl">{season?.rating ? `${season.rating}/5` : 'Chưa có'}</div>
                  </div>
                  <div className="bg-gray-800 p-4 rounded-xl text-center shadow-lg">
                    <FaClock className="w-6 h-6 mx-auto mb-2 text-green-400" />
                    <div className="text-sm text-gray-300">Thời lượng</div>
                    <div className="font-bold text-xl">{season?.runtime ? `${season.runtime} phút` : 'Đang cập nhật'}</div>
                  </div>
                </div>
                <div className="mb-2 text-gray-300">
                  <b>Mô tả:</b> {season?.overview || season?.description || 'Chưa có mô tả'}
                </div>
                <div className="mb-2 text-gray-300">
                  <b>Đạo diễn:</b> {season?.Movie?.director || 'Đang cập nhật'}
                </div>
                <div className="mb-2 text-gray-300">
                  <b>Diễn viên:</b> {season?.Movie?.actors || 'Đang cập nhật'}
                </div>
              </div>
              {/* Đánh giá phim */}
              <div className="mt-6 mb-8">
                <h3 className="text-lg font-semibold mb-2">Đánh giá của bạn:</h3>
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(star => (
                    <button
                      key={star}
                      type="button"
                      disabled={ratingLoading}
                      onClick={() => handleRate(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="focus:outline-none"
                    >
                      <svg
                        className={`w-8 h-8 ${star <= (hoverRating || userRating) ? 'text-yellow-400' : 'text-gray-400'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.38-2.454a1 1 0 00-1.175 0l-3.38 2.454c-.784.57-1.838-.196-1.54-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.05 9.394c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.967z" />
                      </svg>
                    </button>
                  ))}
                  <span className="ml-2 text-yellow-400 font-bold">{userRating}/5</span>
                  {ratingLoading && <span className="ml-2 text-gray-400 text-sm">Đang gửi...</span>}
                </div>
                {season && (
                  <div className="flex items-center gap-4 mb-4">
                    <button
                      onClick={handleFavoriteClick}
                      disabled={favoriteLoading}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                        isFavorite(season.id)
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                      }`}
                    >
                      {favoriteLoading ? (
                        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                      ) : isFavorite(season.id) ? (
                        <FaHeart className="w-5 h-5" />
                      ) : (
                        <FaRegHeart className="w-5 h-5" />
                      )}
                      <span>{isFavorite(season.id) ? 'Đã yêu thích' : 'Yêu thích'}</span>
                    </button>
                  </div>
                )}
              </div>
              {/* Episodes */}
              {season.Episodes && season.Episodes.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2 text-cyan-400">Danh sách tập:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {season.Episodes.map((episode, index) => (
                      <div 
                        key={episode.id}
                        className="p-3 bg-gray-800 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors"
                        onClick={() => navigate(`/watch/${season.id}/${episode.id}`)}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-bold">{episode.episode_number}</span>
                          </div>
                          <div className="flex-grow min-w-0">
                            <p className="text-sm font-semibold text-white">Tập {episode.episode_number}</p>
                            {episode.title && (
                              <p className="text-xs text-gray-400 line-clamp-1">{episode.title}</p>
                            )}
                            {episode.runtime && (
                              <div className="text-xs text-gray-500">{episode.runtime} phút</div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Genres */}
              {season.Movie?.MovieGenres && season.Movie.MovieGenres.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2 text-yellow-400">Thể loại:</h3>
                  <div className="flex flex-wrap gap-2">
                    {season.Movie.MovieGenres.map((mg, index) => (
                      <span key={index} className="bg-red-600 px-3 py-1 rounded-full text-sm">
                        {mg.Genre?.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Overview */}
              {season.overview && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2 text-cyan-400">Tóm tắt:</h3>
                  <p className="text-gray-300 leading-relaxed">{season.overview}</p>
                </div>
              )}

              {/* Cast */}
              {season.MovieActors && season.MovieActors.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2 text-pink-400">Diễn viên:</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {season.MovieActors.slice(0, 6).map((actor, index) => (
                      actor.People && (
                        <div 
                          key={index}
                          className="flex items-center gap-2 p-2 bg-gray-800 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors"
                          onClick={() => navigate(`/people/${actor.People.id}`)}
                        >
                          <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                            {actor.People?.profile_url ? (
                              <img 
                                src={actor.People.profile_url} 
                                alt={actor.People.name}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-sm font-bold text-gray-400">
                                {actor.People?.name?.charAt(0)?.toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white hover:text-blue-400">
                              {actor.People?.name}
                            </div>
                            {actor.role && <div className="text-xs text-gray-400">Vai: {actor.role}</div>}
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                  {season.MovieActors.length > 6 && (
                    <div className="text-center text-gray-400 text-sm mt-2">
                      +{season.MovieActors.length - 6} diễn viên khác
                    </div>
                  )}
                </div>
              )}

              {/* Crew */}
              {season.MovieCrews && season.MovieCrews.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2 text-cyan-400">Đạo diễn & Ekip:</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {season.MovieCrews.slice(0, 6).map((crew, index) => (
                      crew.People && (
                        <div 
                          key={index}
                          className="flex items-center gap-2 p-2 bg-gray-800 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors"
                          onClick={() => navigate(`/people/${crew.People.id}`)}
                        >
                          <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                            {crew.People?.profile_url ? (
                              <img 
                                src={crew.People.profile_url} 
                                alt={crew.People.name}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-sm font-bold text-gray-400">
                                {crew.People?.name?.charAt(0)?.toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white hover:text-blue-400">
                              {crew.People?.name}
                            </div>
                            {crew.job && <div className="text-xs text-gray-400">Vai trò: {crew.job}</div>}
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                  {season.MovieCrews.length > 6 && (
                    <div className="text-center text-gray-400 text-sm mt-2">
                      +{season.MovieCrews.length - 6} thành viên khác
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Bình luận */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Bình luận</h2>

            {message.text && (
              <div className={`p-4 mb-4 rounded-lg ${
                message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleCommentSubmit} className="space-y-4 mb-6">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full bg-gray-800 rounded-lg p-3 text-white"
                rows="3"
                placeholder={user ? "Viết bình luận của bạn..." : "Vui lòng đăng nhập để bình luận"}
                disabled={!user}
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                disabled={!user || !newComment.trim()}
              >
                Gửi bình luận
              </button>
            </form>

            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <img
                      src={comment.User?.avatar || '/default-avatar.jpg'}
                      alt={comment.User?.username}
                      className="w-8 h-8 rounded-full"
                    />
                    <span className="font-semibold">{comment.User?.username}</span>
                    <span className="text-xs text-gray-400">
                      {formatRelativeTime(comment.createdAt)}
                    </span>
                  </div>
                  {/* Hiển thị nội dung bình luận hoặc form sửa */}
                  {editingComment === comment.id ? (
                    <form
                      onSubmit={e => {
                        e.preventDefault();
                        handleEditComment(comment.id);
                      }}
                      className="mt-2"
                    >
                      <textarea
                        value={editContent}
                        onChange={e => setEditContent(e.target.value)}
                        className="w-full bg-gray-700 rounded-lg p-2 text-white"
                        rows="2"
                        placeholder="Chỉnh sửa bình luận..."
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          type="submit"
                          className="bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700"
                          disabled={!editContent.trim()}
                        >
                          Lưu
                        </button>
                        <button
                          type="button"
                          className="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700"
                          onClick={() => {
                            setEditingComment(null);
                            setEditContent('');
                          }}
                        >
                          Hủy
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="text-gray-200 mt-2">{comment.content}</div>
                  )}
                  <div className="flex gap-2 mt-2">
                    <button
                      className="text-green-400 hover:text-green-300"
                      onClick={() => setReplyingTo(comment.id)}
                    >
                      Trả lời
                    </button>
                    {user && (user.id === comment.User?.id || user.role === 'admin') && (
                      <>
                        <button
                          className="text-yellow-400 hover:text-yellow-300"
                          onClick={() => {
                            setEditingComment(comment.id);
                            setEditContent(comment.content);
                          }}
                        >
                          Sửa
                        </button>
                        <button
                          className="text-red-400 hover:text-red-300"
                          onClick={() => handleDeleteComment(comment.id)}
                        >
                          Xóa
                        </button>
                      </>
                    )}
                  </div>
                  {/* Form trả lời */}
                  {replyingTo === comment.id && (
                    <form
                      onSubmit={e => {
                        e.preventDefault();
                        handleReplySubmit(comment.id);
                      }}
                      className="mt-2"
                    >
                      <textarea
                        value={replyContent}
                        onChange={e => setReplyContent(e.target.value)}
                        className="w-full bg-gray-700 rounded-lg p-2 text-white"
                        rows="2"
                        placeholder="Nhập trả lời..."
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          type="submit"
                          className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                          disabled={!replyContent.trim()}
                        >
                          Gửi trả lời
                        </button>
                        <button
                          type="button"
                          className="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700"
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyContent('');
                          }}
                        >
                          Hủy
                        </button>
                      </div>
                    </form>
                  )}
                  {/* Hiển thị replies nếu có */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="ml-8 mt-2 space-y-2">
                      {comment.replies.map(reply => (
                        <div key={reply.id} className="bg-gray-700 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <img
                              src={reply.User?.avatar || '/default-avatar.jpg'}
                              alt={reply.User?.username}
                              className="w-6 h-6 rounded-full"
                            />
                            <span className="font-semibold">{reply.User?.username}</span>
                            <span className="text-xs text-gray-400">
                              {formatRelativeTime(reply.createdAt)}
                            </span>
                          </div>
                          {editingReply === reply.id ? (
                            <form
                              onSubmit={e => {
                                e.preventDefault();
                                handleEditReply(reply.id, comment.id);
                              }}
                              className="mt-2"
                            >
                              <textarea
                                value={editReplyContent}
                                onChange={e => setEditReplyContent(e.target.value)}
                                className="w-full bg-gray-600 rounded-lg p-2 text-white"
                                rows="2"
                                placeholder="Chỉnh sửa trả lời..."
                              />
                              <div className="flex gap-2 mt-2">
                                <button
                                  type="submit"
                                  className="bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700"
                                  disabled={!editReplyContent.trim()}
                                >
                                  Lưu
                                </button>
                                <button
                                  type="button"
                                  className="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700"
                                  onClick={() => {
                                    setEditingReply(null);
                                    setEditReplyContent('');
                                  }}
                                >
                                  Hủy
                                </button>
                              </div>
                            </form>
                          ) : (
                            <div className="text-gray-200">{reply.content}</div>
                          )}
                          {/* Nút sửa cho reply */}
                          {user && (user.id === reply.User?.id || user.role === 'admin') && (
                            <>
                              <button
                                className="text-yellow-400 hover:text-yellow-300 text-xs ml-2"
                                onClick={() => {
                                  setEditingReply(reply.id);
                                  setEditReplyContent(reply.content);
                                }}
                              >
                                Sửa
                              </button>
                              <button
                                className="text-red-400 hover:text-red-300 text-xs ml-2"
                                onClick={() => handleDeleteReply(reply.id, comment.id)}
                              >
                                Xóa
                              </button>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {hasMore && (
              <button
                onClick={loadMoreComments}
                className="mt-4 w-full bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
              >
                Xem thêm bình luận
              </button>
            )}
          </div>

          {/* Phim liên quan */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Phim liên quan</h2>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {related.map((rel) => (
                <MovieCard
                  key={rel.id}
                  season={rel}
                  size="small"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      {showLoginModal && (
        <Login onClose={() => setShowLoginModal(false)} onLoginSuccess={() => window.location.reload()} />
      )}
    </>
  );
};

export default MovieDetail;