/** @type {Record<'ko' | 'en', Record<string, string | Record<string, string>>>} */
export const messages = {
  ko: {
    nav: {
      dashboard: '대시보드',
      chatbot: '공항 챗봇',
      logout: '로그아웃',
    },
    theme: { toLight: '라이트 모드', toDark: '다크 모드' },
    brand: 'ICN Flight Alert',
    lang: { ko: '한국어', en: 'English', switch: '언어' },
    login: {
      title: 'ICN Flight Alert',
      subtitle: '인천공항 비행편 실시간 알림',
      email: '이메일',
      password: '비밀번호',
      show: '보기',
      hide: '숨기기',
      submit: '로그인',
      loading: '로그인 중...',
      signupCta: '회원가입',
      noAccount: '계정이 없으신가요?',
      forgot: '비밀번호를 잊으셨나요?',
    },
    dashboard: {
      flightsTitle: '내 비행편',
      imminentHint: '출발이 임박한 활성 비행편이 있으면 목록을 약 90초마다 자동으로 다시 불러옵니다.',
    },
  },
  en: {
    nav: {
      dashboard: 'Dashboard',
      chatbot: 'Airport chatbot',
      logout: 'Log out',
    },
    theme: { toLight: 'Light mode', toDark: 'Dark mode' },
    brand: 'ICN Flight Alert',
    lang: { ko: 'Korean', en: 'English', switch: 'Language' },
    login: {
      title: 'ICN Flight Alert',
      subtitle: 'Incheon flight alerts',
      email: 'Email',
      password: 'Password',
      show: 'Show',
      hide: 'Hide',
      submit: 'Sign in',
      loading: 'Signing in…',
      signupCta: 'Sign up',
      noAccount: 'No account?',
      forgot: 'Forgot password?',
    },
    dashboard: {
      flightsTitle: 'My flights',
      imminentHint:
        'When an active flight is departing within 3 hours, the list refreshes about every 90 seconds.',
    },
  },
};
