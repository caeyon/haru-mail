import React, { useEffect, useState } from 'react';
import Header from '../header/Header';
import './MailSettingPage.css';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../utils/axiosInstance.ts'; // apiClient 임포트 경로 확인!

const MailSetting: React.FC = () => {
  const navigate = useNavigate();
  const [selectedOption, setSelectedOption] = useState<string>('daily');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuthStatus() {
      try {
        setLoading(true);
        // fetch 대신 apiClient 사용
        await apiClient.get('/api/auth/me');
        // apiClient는 401 Unauthorized와 같은 에러를 인터셉터에서 처리하고 리다이렉트하므로,
        // 여기서는 성공적으로 응답을 받았다면 별도의 userRes.ok 체크가 필요 없음

      } catch (error: any) { // Axios 에러 처리
        console.error('인증 상태 확인 중 오류 발생:', error);

        // apiClient 인터셉터에서 401 Unauthorized 에러를 처리하고 로그인 페이지로 리다이렉트
        if (error.response && error.response.status === 401) {
          alert('세션이 만료되었습니다. 다시 로그인해주세요.');
          navigate('/');
        } else {
          alert('페이지 로딩 중 오류가 발생했습니다. 다시 로그인해주세요.');
          navigate('/');
        }
      } finally {
        setLoading(false);
      }
    }

    checkAuthStatus();
  }, [navigate]);

  const mailOptions = [
    { value: 'daily', label: '매일 받아 볼래요! (주 7회)' },
    { value: '3times', label: '주 3회만 받을래요!' },
    { value: 'once', label: '주 1회만 받을래요!' },
    { value: 'never', label: '메일을 받지 않을래요!' },
  ];

  const handleOptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedOption(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // fetch 대신 apiClient.post() 사용
      // credentials: "include"는 axiosInstance에 설정되어 있으므로 별도 명시 불필요
      const response = await apiClient.post('/api/mail/settings', { selectedOption });

      // Axios는 2xx 응답이면 .ok 확인 없이 바로 다음으로 넘어감
      // 401 같은 에러는 apiClient 인터셉터가 잡아서 처리
      console.log('설정 저장 성공:', response.data);
      alert(`설정이 완료되었습니다!`);
    } catch (error: any) { // Axios 에러 처리
      console.error('서버와의 통신 중 오류 발생:', error);

      if (error.response && error.response.status === 401) {
        alert('세션이 만료되어 설정을 저장할 수 없습니다. 다시 로그인해주세요.');
        navigate('/');
      } else {
        alert('설정 저장에 실패했습니다. 다시 시도해주세요.');
      }
    }
  };

  if (loading) {
    return <div className="loading">로딩 중...</div>;
  }

  return (
    <div className="webpage-layout">
      <Header />

      <main className="mail-setting-main">
        <section className="mail-setting-content">
          <h2 className="title">메일 수신을 어떻게 하시겠어요?</h2>
          <form onSubmit={handleSubmit} className="form">
            {mailOptions.map((option) => (
              <label key={option.value} className="radio-label">
                <input
                  type="radio"
                  value={option.value}
                  checked={selectedOption === option.value}
                  onChange={handleOptionChange}
                  className="radio-input"
                />
                <span className="custom-radio" />
                {option.label}
              </label>
            ))}
            <button type="submit" className="submit-button">설정하기</button>
          </form>
        </section>
      </main>
    </div>
  );
};

export default MailSetting;