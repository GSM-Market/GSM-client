import Card from './ui/Card';
import Button from './ui/Button';

const PrivacyModal = ({ isOpen, onClose, onAgree }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6 bg-white shadow-2xl border-2 border-gray-300" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">개인정보 수집 및 이용</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="text-sm text-gray-900 space-y-4 bg-white p-2">
          <div>
            <h3 className="font-semibold mb-2 text-gray-900">1. 수집하는 개인정보의 항목</h3>
            <p className="text-gray-900">서비스는 회원가입, 상담, 서비스 신청 등을 위해 아래와 같은 개인정보를 수집하고 있습니다.</p>
            <div className="mt-2 ml-4">
              <p className="text-gray-900"><strong>필수항목:</strong> 이메일, 비밀번호, 닉네임(실명)</p>
              <p className="text-gray-900"><strong>자동수집항목:</strong> IP주소, 쿠키, MAC주소, 서비스 이용 기록, 접속 로그</p>
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-2 text-gray-900">2. 개인정보의 수집 및 이용목적</h3>
            <p className="text-gray-900">서비스는 수집한 개인정보를 다음의 목적을 위해 활용합니다.</p>
            <div className="mt-2 ml-4">
              <p className="text-gray-900">- 회원 관리: 회원제 서비스 이용에 따른 본인확인, 개인 식별, 불량회원의 부정 이용 방지와 비인가 사용 방지</p>
              <p className="text-gray-900">- 서비스 제공: 중고거래 플랫폼 서비스 제공, 상품 등록 및 조회, 채팅 서비스 제공</p>
              <p className="text-gray-900">- 서비스 개선: 신규 서비스 개발 및 특화, 맞춤 서비스 제공, 서비스 품질 향상</p>
              <p className="text-gray-900">- 고객 지원: 민원처리, 분쟁조정을 위한 기록 보존</p>
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-2 text-gray-900">3. 개인정보의 보유 및 이용기간</h3>
            <p className="text-gray-900">원칙적으로, 개인정보 수집 및 이용목적이 달성된 후에는 해당 정보를 지체없이 파기합니다. 단, 다음의 정보에 대해서는 아래의 이유로 명시한 기간 동안 보존합니다.</p>
            <div className="mt-2 ml-4">
              <p className="text-gray-900"><strong>회원 정보:</strong> 회원 탈퇴 시까지 (단, 관계 법령 위반에 따른 수사·조사 등이 진행중인 경우에는 해당 수사·조사 종료 시까지)</p>
              <p className="text-gray-900"><strong>서비스 이용 기록:</strong> 3년 (통신비밀보호법)</p>
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-2 text-gray-900">4. 개인정보의 제3자 제공</h3>
            <p className="text-gray-900">서비스는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만, 아래의 경우에는 예외로 합니다.</p>
            <div className="mt-2 ml-4">
              <p className="text-gray-900">- 이용자들이 사전에 동의한 경우</p>
              <p className="text-gray-900">- 법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</p>
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-2 text-gray-900">5. 개인정보 처리의 위탁</h3>
            <p className="text-gray-900">서비스는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를 위탁하고 있습니다.</p>
            <div className="mt-2 ml-4">
              <p className="text-gray-900">- 위탁받는 자: 없음</p>
              <p className="text-gray-900">- 위탁하는 업무의 내용: 없음</p>
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-2 text-gray-900">6. 이용자 및 법정대리인의 권리와 그 행사방법</h3>
            <p className="text-gray-900">이용자는 언제든지 등록되어 있는 자신의 개인정보를 조회하거나 수정할 수 있으며, 회원 탈퇴를 요청할 수 있습니다.</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2 text-gray-900">7. 개인정보의 파기</h3>
            <p className="text-gray-900">서비스는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2 text-gray-900">8. 개인정보 보호책임자</h3>
            <p className="text-gray-900">서비스는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.</p>
            <div className="mt-2 ml-4">
              <p className="text-gray-900"><strong>개인정보 보호책임자:</strong> 관리자</p>
              <p className="text-gray-900"><strong>이메일:</strong> admin@gsm.hs.kr</p>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 mt-4">시행일자: 2024년 1월 1일</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <Button
            onClick={() => {
              onAgree();
              onClose();
            }}
            variant="primary"
          >
            동의하고 닫기
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default PrivacyModal;

