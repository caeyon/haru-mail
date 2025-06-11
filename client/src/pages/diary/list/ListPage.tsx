import React, { useEffect, useState } from 'react';
import Header from '../../header/Header';
import './ListPage.css';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../../utils/axiosInstance.ts'; // apiClient 임포트 경로 확인!

interface DiaryItem {
  id: number;
  title: string;
  date: string;
}

interface UserInfo {
  username: string;
  email: string;
}

const ListPage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [diaries, setDiaries] = useState<DiaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentYear, setCurrentYear] = useState<number>(0);
  const [currentMonth, setCurrentMonth] = useState<number>(0);

  // 현재 월을 기준으로 연도와 월 초기화
  useEffect(() => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth() + 1); // 월은 0부터 시작하므로 +1 필요
  }, []);

  // API 호출 및 데이터 로딩
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        // 1) 사용자 정보 호출
        // fetch 대신 apiClient 사용
        const userRes = await apiClient.get<UserInfo>('/api/auth/me'); // UserInfo 타입을 명시하여 타입 안정성 확보
        setUser(userRes.data); // Axios는 응답 본문을 .data에 넣어줌

        // 2) 월과 연도를 쿼리 파라미터로 전달하여 일기 목록 호출
        // fetch 대신 apiClient 사용
        const diaryRes = await apiClient.get<DiaryItem[]>(
          `/api/diary/list?year=${currentYear}&month=${currentMonth}`
        );
        setDiaries(diaryRes.data); // Axios는 응답 본문을 .data에 넣어줌

      } catch (error: any) { // Axios 에러를 처리하기 위해 타입을 any로 지정
        console.error('API 호출 중 오류 발생:', error);

        // apiClient 인터셉터에서 401 Unauthorized 에러를 처리하고 로그인 페이지로 리다이렉트
        // 따라서 여기서는 401을 명시적으로 처리할 필요는 없지만,
        // 인터셉터에서 잡지 못하는 다른 종류의 에러(예: 네트워크 연결 끊김)에 대비
        if (error.response && error.response.status === 401) {
          // 이 코드는 사실상 실행되지 않을 가능성이 높지만, 명시적으로 남겨둠
          alert('세션이 만료되었습니다. 다시 로그인해주세요.');
          navigate('/');
        } else {
          alert('페이지 로딩 중 오류가 발생했습니다. 다시 시도해주세요.');
          navigate('/');
        }
      } finally {
        setLoading(false);
      }
    }

    // currentYear와 currentMonth가 유효한 값일 때만 fetchData 호출
    if (currentYear !== 0 && currentMonth !== 0) {
      fetchData();
    }
  }, [currentYear, currentMonth, navigate]); // currentYear, currentMonth 변경 시 fetchData 재실행

  // 이전 달로 이동 (변경 없음)
  const handlePrevMonth = () => {
    setCurrentMonth(prevMonth => {
      if (prevMonth === 1) {
        setCurrentYear(prevYear => prevYear - 1);
        return 12;
      } else {
        return prevMonth - 1;
      }
    });
  };

  // 다음 달로 이동 (변경 없음)
  const handleNextMonth = () => {
    setCurrentMonth(prevMonth => {
      if (prevMonth === 12) {
        setCurrentYear(prevYear => prevYear + 1);
        return 1;
      } else {
        return prevMonth + 1;
      }
    });
  };

  if (loading) {
    return <div className="loading">로딩 중...</div>;
  }

  return (
    <div className="webpage-layout">
      <Header /> {/* Header는 이미 디자인되어 있다고 가정 */}

      <main className="webpage-container">
        <div className="header-container">
          {/* 이미지에 맞춰 username이 다른 색상이나 줄바꿈 없이 한 문장으로 */}
          <h2>
            <span className="username">{user?.username ?? '사용자'}</span> 님이 작성하신 일기 목록이에요!
          </h2>

          <div className="calendar-header">
            <button className="arrow" onClick={handlePrevMonth}>&lt;</button>
            <span className="month-label">
              {currentYear}년 {currentMonth}월
            </span>
            <button className="arrow" onClick={handleNextMonth}>&gt;</button>
          </div>
        </div>

        <section id="diary-list" className="diary-list">
          {diaries.length === 0 ? (
            <p className="empty">작성된 일기가 없습니다.</p>
          ) : (
            diaries.map(diary => {
              const date = new Date(diary.date);
              return (
                <div
                  key={diary.id}
                  className="diary-item"
                  onClick={() => navigate(`/diary/${diary.id}`)}
                >
                  <div className="date-tag">
                    <span className="date-number">{date.getDate()}</span>
                    <span className="date-suffix">일</span>
                  </div>
                  <div className="diary-title">{diary.title}</div>
                  <div className="arrow">→</div>
                </div>
              );
            })
          )}
        </section>

        <button className="write-button" onClick={() => navigate('/editor/제목을 입력해 주세요!')}>
          일기 작성하기 ✏️
        </button>
      </main>
    </div>
  );
};

export default ListPage;