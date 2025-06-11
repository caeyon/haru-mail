import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Location } from 'react-router-dom';
import Header from '../../header/Header.tsx';
import { destroyEditor, getEditorData, getFormattedToday, initializeEditor } from './DiaryEditor.ts';
import './DiaryEditorPage.css';
import { CategoryTags, initialCategoryTags } from "./TagData.ts";
import { handleTagClick, handleRemoveTag } from './TagHandler.ts';
import { usePrompt } from "./usePrompt.tsx";
import apiClient from '../../../utils/axiosInstance.ts'; // apiClient 임포트 경로 확인!

export const DiaryEditorPage: React.FC = () => {
    const editorContainerRef = useRef<HTMLDivElement | null>(null);
    const [showModal, setShowModal] = useState(false);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const [categoryTags, setCategoryTags] = useState<CategoryTags>(initialCategoryTags);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [showAddCategoryButton, setShowAddCategoryButton] = useState<boolean>(false);
    const [selectedTags, setSelectedTags] = useState<{ id: number; emoji: string; label: string }[]>([]);
    const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
    const [isTagLimitModalOpen, setIsTagLimitModalOpen] = useState(false);

    const [isAddingTag, setIsAddingTag] = useState(false);
    const [newTagName, setNewTagName] = useState("");

    const formattedDate = getFormattedToday();

    const { questionText } = useParams<{ questionText: string }>();
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [title, setTitle] = useState(questionText ? decodeURIComponent(questionText) + '?' : "제목을 입력해주세요!"); // 초기값 설정 변경

    const [isWriting, setIsWriting] = useState(false); // 일기 작성 여부
    const [pendingNavigation, setPendingNavigation] = useState<null | (() => void)>(null);
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [shouldNavigate, setShouldNavigate] = useState(false);

    useEffect(() => {
        const checkAuthAndFetchData = async () => {
            try {
                setLoading(true);

                // 1. 인증 확인
                // fetch 대신 apiClient 사용
                const userRes = await apiClient.get('/api/auth/me'); // credentials: 'include'는 apiClient에 설정되어 있음
                // userRes.ok 대신 axios의 성공 여부 판단 (에러가 나면 catch 블록으로 이동)

                // 2. 질문 타이틀 설정
                if (questionText) {
                    setTitle(decodeURIComponent(questionText));
                }

                // 3. 에디터 초기화
                if (editorContainerRef.current) {
                    initializeEditor(editorContainerRef.current, onEditorChange);
                }

                // 4. 기타 태그 불러오기
                const response = await apiClient.get('/api/category/6');

                // Axios는 204 No Content 응답 시 res.data가 빈 객체가 될 수 있음
                // 따라서 response.status === 204 대신 res.data의 존재 여부 및 배열 여부로 판단
                const data = response.data;
                console.log('서버에서 가져온 기타 태그 데이터:', data); // 이 로그를 통해 실제 데이터 형태 확인!

                if (Array.isArray(data)) { // 데이터가 배열인지 명확히 확인
                    const newTag = data.map((tag: any) => ({
                        id: tag.tagId,
                        emoji: '🏷️',
                        label: tag.name
                    }));
                    setCategoryTags(prev => ({ ...prev, '기타': newTag }));
                } else if (data && Object.keys(data).length === 0) { // 빈 객체 {} 이거나 204 응답의 경우
                    setCategoryTags(prev => ({ ...prev, '기타': [] }));
                } else {
                    // 예상치 못한 데이터 형태일 경우 에러 처리
                    console.error('예상치 못한 기타 태그 데이터 형태:', data);
                    setCategoryTags(prev => ({ ...prev, '기타': [] })); // 안전하게 빈 배열로 설정
                }

                setNewTagName('');
                setIsAddingTag(false);


            } catch (error: any) { // error 타입을 any로 설정하여 error.response 등 접근 가능하게 함
                console.error('페이지 초기 로딩 중 치명적인 오류 발생:', error);

                // Axios 에러 처리 (인터셉터에서 처리되지 않은 특정 경우)
                if (error.response && error.response.status === 401) {
                    alert('로그인이 필요하거나 세션이 만료되었습니다. 다시 로그인해주세요.');
                    navigate('/');
                } else {
                    alert('페이지 로딩 중 오류가 발생했습니다. 다시 시도해주세요.');
                    navigate('/'); // 일반적인 오류 시에도 홈으로 리다이렉트
                }
            } finally {
                setLoading(false);
            }
        };

        checkAuthAndFetchData();

        return () => {
            destroyEditor();
        };

    }, [questionText, navigate]); // 의존성 배열에 questionText와 navigate 유지

    // shouldNavigate 및 pendingNavigation 처리 로직은 변경 없음

    useEffect(() => {
        if (shouldNavigate && pendingNavigation) {
            pendingNavigation();
            setPendingNavigation(null);
            setShouldNavigate(false);
        }
    }, [shouldNavigate, pendingNavigation]);

    // 로그아웃 클릭 시 확인 모달 띄우는 로직은 변경 없음
    useEffect(() => {
        const handleLogoutClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.closest('#logout-btn')) {
                if (isWriting) {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowLeaveModal(true);
                }
            }
        };

        window.addEventListener('click', handleLogoutClick, true);

        return () => {
            window.removeEventListener('click', handleLogoutClick, true);
        };
    }, [isWriting]);

    // 일기 저장 (handleSave)
    const handleSave = async () => {
        setIsWriting(false); // 저장 시도 시 isWriting 상태 false로 변경
        const content = await getEditorData();
        // const accessToken = localStorage.getItem("accessToken"); // 더 이상 필요 없음

        const diaryData = {
            title: title,
            content: content,
        };

        const tagList = selectedTagIds.map(id => ({ tagId: id }));

        const requestData = {
            diary: diaryData,
            tags: tagList
        };

        console.log("보내는 데이터:", JSON.stringify(requestData));

        try {
            // fetch 대신 apiClient.post() 사용
            const response = await apiClient.post('/api/diary/save', requestData); // credentials: 'include'는 apiClient에 설정

            console.log("서버에 저장 완료:", response.data); // response.data로 접근
            setShowModal(true); // 성공 시 모달 열기
        } catch (error: any) {
            console.error("저장 중 오류 발생:", error);
            // Axios 에러 처리 (인터셉터에서 처리되지 않은 특정 경우)
            if (error.response && error.response.status === 401) {
                alert('세션이 만료되어 저장이 불가능합니다. 다시 로그인해주세요.');
                navigate('/');
            } else {
                alert("저장에 실패했습니다. 다시 시도해주세요.");
            }
        }
    };

    // 모달 닫기
    const closeModal = () => {
        setShowModal(false);
        navigate('/list');
    };

    // 카테고리 전환 처리 (변경 없음)
    const handleCategoryClick = (category: string) => {
        if (selectedCategory === category) {
            setSelectedCategory('');
            setShowAddCategoryButton(false);
        } else {
            setSelectedCategory(category);
            setShowAddCategoryButton(category === '기타');
        }
    };

    // 커스텀 태그 입력 모드로 전환 (변경 없음)
    const handleAddTagClick = () => {
        setIsAddingTag(true);
    };

    // 태그 생성 (handleNewTagKeyDown)
    const handleNewTagKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && newTagName.trim() !== '') {
            const newTag = {
                name: newTagName.trim(),
                categoryId: 6, // 기타 카테고리 ID
            };
            console.log("태그 생성:", newTag);

            try {
                // fetch 대신 apiClient.post() 사용
                const response = await apiClient.post('/api/tag/create', newTag);

                console.log("태그가 성공적으로 추가되었습니다:", response.data);
                const createdTag = {
                    id: response.data.id, // response.data로 접근
                    emoji: '🏷️',
                    label: response.data.name // response.data로 접근
                };
                setCategoryTags(prev => ({
                    ...prev,
                    '기타': [
                        ...prev['기타'],
                        createdTag
                    ]
                }));
                setNewTagName('');
                setIsAddingTag(false);
            } catch (error: any) {
                console.error("태그 생성 중 오류 발생:", error);
                // Axios 에러 처리 (인터셉터에서 처리되지 않은 특정 경우)
                if (error.response && error.response.status === 401) {
                    alert('세션이 만료되어 태그 생성이 불가능합니다. 다시 로그인해주세요.');
                    navigate('/');
                } else {
                    alert('태그 생성에 실패했습니다.');
                }
            }
        } else if (e.key === 'Escape') {
            setNewTagName('');
            setIsAddingTag(false);
        }
    };

    // 제목 관련 핸들러들은 변경 없음
    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTitle(e.target.value);
    };

    const handleTitleBlur = () => {
        setIsEditingTitle(false);
    };

    const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            setIsEditingTitle(false);
        }
    };

    // 일기 작성 여부 확인 (변경 없음)
    const onEditorChange = async () => {
        try {
            const content = await getEditorData();
            if (!content || content.trim().length === 0 || content === '<p><br></p>') { // 초기 빈 값 '<p><br></p>' 처리
                setIsWriting(false); // 내용 없으면 작성 중 아님
                return;
            }
            setIsWriting(true);
        } catch (error) {
            console.error("에디터 데이터 로딩 실패:", error);
        }
    };

    // usePrompt 관련 로직 (변경 없음)
    usePrompt(isWriting, (nextLocation: Location) => {
        setPendingNavigation(() => () => navigate(nextLocation.pathname));
        setShowLeaveModal(true);
        return false;
    });

    const confirmLeave = () => {
        setShowLeaveModal(false);
        setIsWriting(false); // 떠날 것이므로 작성 중 상태를 false로 설정
        setShouldNavigate(true); // 실제 이동 트리거
    };

    const cancelLeave = () => {
        setShowLeaveModal(false);
    };

    // 태그 갯수 제한 모달
    const openTagLimitModal = () => {
        setIsTagLimitModalOpen(true);
    };

    return (
        <div className="diary-page">
            <Header />
            <main className="main-content">
                {isEditingTitle ? (
                    <input
                        className="title-input"
                        type="text"
                        value={title}
                        onChange={handleTitleChange}
                        onBlur={handleTitleBlur}
                        onKeyDown={handleTitleKeyDown}
                        autoFocus
                    />
                ) : (
                    <h1 className="editor-title" onClick={() => setIsEditingTitle(true)}>
                        {title}
                    </h1>
                )}
                <p className="editor-date">{formattedDate}</p>
                <div
                    className="editor-container"
                    ref={editorContainerRef}
                ></div>

                <div className="tag-section">
                    <div className="selected-tags-list">
                        {selectedTags.map((tag) => (
                            <span key={tag.id} className="tag"
                                  onClick={() => handleRemoveTag(tag, selectedTags, selectedTagIds, setSelectedTags, setSelectedTagIds)}>
                                #{tag.label}
                            </span>
                        ))}
                    </div>
                    <div className="category-buttons">
                        {['기분', '생활 & 경험', '취미', '특별한 순간', '날씨', '기타'].map((category) => (
                            <button
                                key={category}
                                className={`category ${selectedCategory === category ? 'active' : ''}`}
                                onClick={() => handleCategoryClick(category)}
                            >
                                {category}
                            </button>
                        ))}
                    </div>

                    {selectedCategory && (
                        <div className="tag-section">
                            {categoryTags[selectedCategory].map((tag) => {
                                const isActive = selectedTagIds.includes(tag.id); // 혹은 selectedTags에서 확인

                                return (
                                    <span
                                        key={tag.id}
                                        className={`category-tag ${isActive ? 'active' : ''}`}
                                        onClick={() => handleTagClick(tag, selectedTags, selectedTagIds, setSelectedTags, setSelectedTagIds, openTagLimitModal)}
                                        data-id={tag.id}
                                    >
                                        {tag.emoji} {tag.label}
                                    </span>
                                );
                            })}
                        </div>
                    )}

                    {showAddCategoryButton && (
                        <div className="tag-add">
                            {isAddingTag ? (
                                <input
                                    type="text"
                                    value={newTagName}
                                    onChange={(e) => setNewTagName(e.target.value)}
                                    onKeyDown={handleNewTagKeyDown}
                                    placeholder="태그 입력 후 Enter"
                                    className="new-tag-input"
                                    autoFocus
                                />
                            ) : (
                                <button className="add-category-button" onClick={handleAddTagClick}>
                                    +
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div className="button-wrapper">
                    <button className="submit-button" onClick={handleSave}>작성 완료</button>
                </div>
            </main>

            {/* 모달창 */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <p>저장이 완료되었습니다!</p>
                        <button className="modal-close-button" onClick={closeModal}>확인</button>
                    </div>
                </div>
            )}

            {showLeaveModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <p>작성 중인 내용이 있습니다. 이동하시겠습니까?</p>
                        <div className="modal-button-group">
                            <button className="modal-close-button" onClick={confirmLeave}>예</button>
                            <button className="modal-close-button" onClick={cancelLeave}>아니요</button>
                        </div>
                    </div>
                </div>
            )}

            {loading && (
                <div className="loading-overlay">
                    <div className="loading-spinner">로딩 중...</div>
                </div>
            )}

            {isTagLimitModalOpen && (
                <div className="modal-overlay">
                    <div className="modal">
                        <p>태그는 최대 10개까지만 선택할 수 있습니다.</p>
                        <button className="modal-close-button" onClick={() => setIsTagLimitModalOpen(false)}>확인</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DiaryEditorPage;