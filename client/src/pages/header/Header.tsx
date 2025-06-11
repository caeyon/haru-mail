import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Header.css';
import apiClient from '../../utils/axiosInstance.ts'; // apiClient 임포트 경로 확인!

const Header: React.FC = () => {
    const navigate = useNavigate();
    const [token, setToken] = useState<string>('');
    const [menuOpen, setMenuOpen] = useState<boolean>(false);

    const navRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);

    // 쿠키에서 토큰을 읽는 함수
    const getAccessTokenFromCookies = (): string => {
        const name = 'accessToken=';
        const decoded = decodeURIComponent(document.cookie);
        return decoded
            .split('; ')
            .find((row) => row.startsWith(name))
            ?.substring(name.length) ?? '';
    };

    // 마운트 시 토큰을 상태로 저장
    useEffect(() => {
        const accessToken = getAccessTokenFromCookies();
        setToken(accessToken);
    }, []);

    // 외부 클릭 시 메뉴 닫기
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (menuOpen && navRef.current && !navRef.current.contains(target)) {
                const hamburger = document.querySelector('.hamburger');
                if (hamburger && hamburger.contains(target)) {
                    return;
                }
                setMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [menuOpen]);

    const handleLogout = async () => {
        if (!token) {
            console.log('로그인 상태가 아닙니다.');
            // 사용자가 이미 로그아웃 상태라면 알림 후 홈으로 이동
            alert('이미 로그아웃되었습니다.'); // 추가: 이미 로그아웃된 경우 안내
            navigate('/');
            return;
        }

        try {
            const logoutRes = await apiClient.post('/api/auth/logout');

            console.log('로그아웃 성공', logoutRes.data);

            // Access Token 쿠키 삭제 (expires를 과거로 설정)
            document.cookie = "accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            // Refresh Token 쿠키 삭제 (이름이 'refreshToken'인지 확인 필수)
            document.cookie = "refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

            setToken(''); // React 상태 초기화
            alert('로그아웃되었습니다.');
            navigate('/');
        } catch (error: any) {
            console.error('로그아웃 처리 중 오류 발생:', error);

            if (error.response && error.response.status === 401) {
                alert('세션이 만료되어 로그아웃 처리 중 오류가 발생했습니다. 다시 로그인해주세요.');
                navigate('/');
            } else {
                alert('로그아웃 처리 중 오류가 발생했습니다.');
            }
        }
    };

    return (
        <header className="header">
            <Link to="/" className="header-logo">하루 메일</Link>

            <div className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
                {menuOpen ? (
                    <span className="close-icon">×</span>
                ) : (
                    <>
                        <span className="bar"></span>
                        <span className="bar"></span>
                        <span className="bar"></span>
                    </>
                )}
            </div>

            <nav ref={navRef} className={`nav ${menuOpen ? 'open' : ''}`}>
                <Link to="/list">일기 목록</Link>
                <Link to="/search">일기 검색</Link>
                <Link to="/setting">설정</Link>
                {/* 토큰이 있을 때만 로그아웃 버튼을 표시하도록 조건부 렌더링 */}
                {token ? (
                    <button className="logout-button" onClick={handleLogout} id="logout-btn">로그아웃</button>
                ) : (
                    // 토큰이 없을 때 로그인 버튼을 표시 (선택 사항)
                    <button className="login-button" onClick={() => navigate('/login')}>로그인</button> // '로그인' 페이지 경로에 맞게 수정
                )}
            </nav>

            {menuOpen && <div className="overlay" onClick={() => setMenuOpen(false)} />}
        </header>
    );
};

export default Header;