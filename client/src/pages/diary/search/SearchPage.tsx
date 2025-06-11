import React, {useEffect} from 'react';
import { useState } from "react";
import Header from '../../header/Header.tsx';
import './SearchPage.css';
import { CategoryTags, initialCategoryTags } from "../diaryEditor/TagData.ts";
import {handleRemoveTag} from "../diaryEditor/TagHandler.ts";
import { useNavigate } from 'react-router-dom';
import apiClient from '../../../utils/axiosInstance.ts'; // apiClient 임포트 경로 확인!

const SearchPage: React.FC = () => {
    const navigate = useNavigate();
    const categories = ["기분", "생활 & 경험", "취미", "특별한 순간", "날씨", "기타"];
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [selectedTags, setSelectedTags] = useState<{ id: number; emoji: string; label: string }[]>([]);
    const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
    const [categoryTags, setCategoryTags] = useState<CategoryTags>(initialCategoryTags);
    const [searchResults, setSearchResults] = useState<{ diaryId: number; title: string; date: string }[]>([]);
    const [isTagLimitModalOpen, setIsTagLimitModalOpen] = useState(false);
    const [isNoTagModalOpen, setIsNoTagModalOpen] = useState(false);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                // fetch 대신 apiClient 사용
                const response = await apiClient.get('/api/category/6');

                if (response.status === 204 || (response.data && Object.keys(response.data).length === 0)) {
                    // 204 No Content 또는 빈 응답 데이터인 경우
                    setCategoryTags(prev => ({ ...prev, '기타': [] }));
                } else {
                    const data = response.data; // Axios는 응답 본문을 .data에 넣어줌
                    console.log('서버에서 가져온 태그 데이터:', data);

                    const newTag = data.map((tag: any) => ({
                        id: tag.tagId,
                        emoji: '🏷️',
                        label: tag.name
                    }));

                    setCategoryTags(prev => ({
                        ...prev,
                        '기타': newTag
                    }));
                }
            } catch (error: any) { // Axios 에러 처리
                console.error('기타 태그 불러오기 실패:', error);
                // 401 에러는 apiClient 인터셉터에서 처리되므로 여기서는 다른 오류에 대한 처리만
                if (error.response && error.response.status === 401) {
                    // 이 코드는 실행되지 않을 가능성이 높지만, 명시적으로 남겨둠
                    alert('세션이 만료되었습니다. 다시 로그인해주세요.');
                    navigate('/');
                } else {
                    alert('태그 정보를 불러오는 데 실패했습니다.');
                }
            }
        };

        fetchCategories();
    }, [navigate]); // navigate를 의존성 배열에 추가 (혹시 모를 리다이렉트 상황 대비)

    // 태그 미선택 시
    const openNoTagSelectedModal = () => {
        setIsNoTagModalOpen(true);
    };

    const handleSearch = async () => {
        if (selectedTagIds.length === 0) {
            openNoTagSelectedModal();
            return;
        }

        const queryParams = selectedTagIds.map(id => `tags=${id}`).join('&');

        try {
            // fetch 대신 apiClient 사용
            const response = await apiClient.get(`/api/tag/search?${queryParams}`);

            const data = response.data; // Axios는 응답 본문을 .data에 넣어줌
            console.log("검색 결과:", data);
            setSearchResults(data);
        } catch (error: any) { // Axios 에러 처리
            console.error("검색 오류:", error);
            if (error.response && error.response.status === 401) {
                alert('세션이 만료되었습니다. 다시 로그인해주세요.');
                navigate('/');
            } else {
                alert("검색에 실패했습니다. 다시 시도해주세요.");
            }
        }
    };

    // Modified handleTagClick function (변경 없음)
    const handleTagClick = (tag: { id: number; emoji: string; label: string }) => {
        const isSelected = selectedTagIds.includes(tag.id);

        if (isSelected) {
            setSelectedTags(prev => prev.filter(t => t.id !== tag.id));
            setSelectedTagIds(prev => prev.filter(id => id !== tag.id));
        } else {
            if (selectedTags.length < 5) {
                setSelectedTags(prev => [...prev, tag]);
                setSelectedTagIds(prev => [...prev, tag.id]);
            } else {
                openTagLimitModal();
            }
        }
    };

    // 태그 갯수 제한 모달
    const openTagLimitModal = () => {
        setIsTagLimitModalOpen(true);
    };

    return (
        <div>
            <Header />
            <main className="main-content">
                <div className="search-bar">
                    <div className="selected-tags-container">
                        {selectedTags.length === 0 ? (
                            <span className="placeholder-text">태그를 선택해주세요^^</span>
                        ) : (
                            selectedTags.map((tag) => (
                                <span key={tag.id} className="selected-tag">
                                    {tag.emoji} {tag.label}
                                    <button
                                        className="remove-tag-button"
                                        onClick={() => handleRemoveTag(tag, selectedTags, selectedTagIds, setSelectedTags, setSelectedTagIds)}
                                    >
                                        ❌
                                    </button>
                                </span>
                            ))
                        )}
                    </div>
                    <button className="search-button" onClick={handleSearch}>🔍</button>
                </div>

                <div className="categories">
                    {categories.map((category) => (
                        <button
                            key={category}
                            className={`category ${selectedCategory === category ? "active" : ""}`}
                            onClick={() => setSelectedCategory(category)}
                        >
                            {category}
                        </button>
                    ))}
                </div>

                {selectedCategory && (
                    <div className="tag-wrapper">
                        {/* categoryTags[selectedCategory]가 undefined일 경우를 대비하여 ? 체이닝 사용 */}
                        {categoryTags[selectedCategory]?.map((tag) => (
                            <span
                                key={tag.id}
                                className={`tag-button ${selectedTagIds.includes(tag.id) ? "active" : ""}`}
                                onClick={() => handleTagClick(tag)}
                                data-id={tag.id}
                            >
                                {tag.emoji} {tag.label}
                            </span>
                        ))}
                    </div>
                )}

                {searchResults.length > 0 ? (
                    <div>
                        {Object.entries(
                            searchResults.reduce((acc: Record<string, typeof searchResults>, result) => {
                                const date = new Date(result.date);
                                const yearMonth = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}`;

                                if (!acc[yearMonth]) {
                                    acc[yearMonth] = [];
                                }
                                acc[yearMonth].push(result);
                                return acc;
                            }, {})
                        ).map(([yearMonth, diaries]) => (
                            <div key={yearMonth} className="diary-group">
                                <h2 className="diary-group-title">📅 {yearMonth}</h2>
                                <hr />
                                {diaries.map((result) => (
                                    <div
                                        key={result.diaryId}
                                        className="question-card"
                                        onClick={() => navigate(`/diary/${result.diaryId}`)}
                                    >
                                        <div className="date-box">{new Date(result.date).getDate()}일</div>
                                        <div className="question-text">{result.title}</div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="no-results-message">검색 결과가 없습니다.</div>
                )}

                {isNoTagModalOpen && (
                    <div className="modal-overlay">
                        <div className="modal">
                            <p>태그를 하나 이상 선택해 주세요.</p>
                            <button className="modal-close-button" onClick={() => setIsNoTagModalOpen(false)}>닫기</button>
                        </div>
                    </div>
                )}

                {isTagLimitModalOpen && (
                    <div className="modal-overlay">
                        <div className="modal">
                            <p>태그는 최대 5개까지만 선택할 수 있습니다.</p>
                            <button className="modal-close-button" onClick={() => setIsTagLimitModalOpen(false)}>확인</button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default SearchPage;