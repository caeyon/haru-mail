import React, {useEffect, useRef, useState} from 'react';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import './DiaryDetailPage.css';
import {destroyEditor, initializeViewer} from "./DiaryDetailView.ts";
import {DiaryInfoDto} from "./DiaryInfoDto.ts";
import apiClient from '../../../utils/axiosInstance.ts'; // apiClient 임포트 경로 확인!

const DiaryDetailPage: React.FC = () => {
    const { diaryId } = useParams<{ diaryId: string }>(); // URL에서 diaryId 파라미터 추출
    const viewerContainerRef = useRef<HTMLDivElement | null>(null);
    const [diaryData, setDiaryData] = useState<DiaryInfoDto | null>(null);
    const navigate = useNavigate();

    // 날짜 포맷팅 함수
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);  // ISO 형식의 문자열을 Date 객체로 변환
        const dayOfWeek = date.toLocaleString('ko-KR', { weekday: 'short' }); // 요일 가져오기 (예: '월', '화')
        const day = date.getDate();
        const month = date.getMonth() + 1; // 월 (0부터 시작하므로 +1)
        const year = date.getFullYear();

        return `${year}.${month}.${day} (${dayOfWeek})`;
    };

    useEffect(() => {
        const fetchAndInit = async () => {
            if (!viewerContainerRef.current) {
                console.warn('뷰어 컨테이너가 준비되지 않았습니다.');
                return;
            }

            try {
                // 기존 fetch 대신 apiClient.get() 사용
                // axiosInstance는 이미 baseURL과 withCredentials, 그리고 토큰 재발급 로직을 가지고 있음
                const res = await apiClient.get(`/api/diary/${diaryId}`);
                const data: DiaryInfoDto = res.data; // Axios는 응답 본문을 `res.data`에 넣음.
                const savedJson = JSON.parse(data.content);

                console.log("받아온 일기 데이터:", savedJson); // 콘솔 출력

                // TUI Viewer 초기화
                initializeViewer(viewerContainerRef.current, savedJson);
                setDiaryData(data);
            } catch (error) {
                console.error('데이터 로딩 및 뷰어 초기화 실패:', error);
                // 이곳에서는 더 이상 401 에러를 직접 처리X
                // apiClient의 응답 인터셉터가 토큰 재발급 또는 로그인 페이지 리다이렉션을 처리
            }
        };

        fetchAndInit();

        // 컴포넌트 언마운트 시 TUI Editor/Viewer 인스턴스 정리
        return () => {
            destroyEditor(); // 또는 destroyViewer()와 같이 뷰어 전용 함수가 있다면 사용
        };
    }, [diaryId]); // diaryId가 변경될 때마다 재실행

    return (
        <div className="fullscreenContainer">
            <button
                className="backButton"
                onClick={() => navigate(-1)} // 이전 페이지로 이동
            >
                {'←'}
            </button>
            <div className="container">
                {/* 일기 제목 */}
                <h1 className="detailPage-title">{diaryData?.title || '일기 제목 불러오는 중...'}</h1>
                {/* 일기 날짜 */}
                <p className="date">{diaryData?.date ? formatDate(diaryData.date) : '날짜 불러오는 중...'}</p>
                <div className="viewerWrapper">
                    {/* TUI Viewer가 마운트될 요소 */}
                    <div
                        className="viewerContainer"
                        ref={viewerContainerRef}
                    ></div>
                </div>
                {/* 태그 목록 */}
                <div className="selected-tags">
                    {diaryData?.tags.map((tag, index) => (
                        <div key={index} className="diary-tags">#{tag}</div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DiaryDetailPage;