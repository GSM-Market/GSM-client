import Card from './ui/Card';
import Button from './ui/Button';

const TermsModal = ({ isOpen, onClose, onAgree }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6 bg-white shadow-2xl border-2 border-gray-300" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">이용약관</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="text-sm text-gray-900 space-y-4 bg-white">
          <div>
            <h3 className="font-semibold mb-2 text-gray-900">제1조 (목적)</h3>
            <p className="text-gray-900">본 약관은 GSM Market(이하 "서비스")이 제공하는 중고거래 플랫폼 서비스의 이용과 관련하여 서비스와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2 text-gray-900">제2조 (정의)</h3>
            <p className="text-gray-900">1. "서비스"란 GSM Market이 제공하는 중고거래 플랫폼 서비스를 의미합니다.</p>
            <p className="text-gray-900">2. "이용자"란 본 약관에 따라 서비스를 이용하는 회원 및 비회원을 의미합니다.</p>
            <p className="text-gray-900">3. "회원"이란 서비스에 회원등록을 하고 서비스를 이용하는 자를 의미합니다.</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2 text-gray-900">제3조 (약관의 게시와 개정)</h3>
            <p className="text-gray-900">1. 서비스는 본 약관의 내용을 이용자가 쉽게 알 수 있도록 서비스 초기 화면에 게시합니다.</p>
            <p className="text-gray-900">2. 서비스는 필요한 경우 관련 법령을 위배하지 않는 범위에서 본 약관을 개정할 수 있습니다.</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2 text-gray-900">제4조 (회원가입)</h3>
            <p className="text-gray-900">1. 이용자는 서비스가 정한 가입 양식에 따라 회원정보를 기입한 후 본 약관에 동의한다는 의사표시를 함으로서 회원가입을 신청합니다.</p>
            <p className="text-gray-900">2. 서비스는 제1항과 같이 회원가입을 신청한 이용자 중 다음 각 호에 해당하지 않는 한 회원으로 등록합니다.</p>
            <p className="ml-4 text-gray-900">- 가입신청자가 이전에 회원자격을 상실한 적이 있는 경우</p>
            <p className="ml-4 text-gray-900">- 등록 내용에 허위, 기재누락, 오기가 있는 경우</p>
            <p className="ml-4 text-gray-900">- 기타 회원으로 등록하는 것이 서비스의 기술상 현저히 지장이 있다고 판단되는 경우</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2 text-gray-900">제5조 (서비스의 제공 및 변경)</h3>
            <p className="text-gray-900">1. 서비스는 다음과 같은 서비스를 제공합니다.</p>
            <p className="ml-4 text-gray-900">- 중고거래 플랫폼 서비스</p>
            <p className="ml-4 text-gray-900">- 상품 등록, 조회, 검색 서비스</p>
            <p className="ml-4 text-gray-900">- 채팅 서비스</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2 text-gray-900">제6조 (서비스의 중단)</h3>
            <p className="text-gray-900">1. 서비스는 컴퓨터 등 정보통신설비의 보수점검, 교체 및 고장, 통신의 두절 등의 사유가 발생한 경우에는 서비스의 제공을 일시적으로 중단할 수 있습니다.</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2 text-gray-900">제7조 (회원의 의무)</h3>
            <p className="text-gray-900">1. 회원은 다음 행위를 하여서는 안 됩니다.</p>
            <p className="ml-4 text-gray-900">- 신청 또는 변경 시 허위내용의 등록</p>
            <p className="ml-4 text-gray-900">- 타인의 정보 도용</p>
            <p className="ml-4 text-gray-900">- 서비스에 게시된 정보의 변경</p>
            <p className="ml-4 text-gray-900">- 서비스가 정한 정보 이외의 정보(컴퓨터 프로그램 등) 등의 송신 또는 게시</p>
            <p className="ml-4 text-gray-900">- 서비스와 기타 제3자의 저작권 등 지적재산권에 대한 침해</p>
            <p className="ml-4 text-gray-900">- 서비스와 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위</p>
            <p className="ml-4 text-gray-900">- 외설 또는 폭력적인 메시지, 화상, 음성, 기타 공서양속에 반하는 정보를 서비스에 공개 또는 게시하는 행위</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2 text-gray-900">제8조 (개인정보보호)</h3>
            <p className="text-gray-900">1. 서비스는 이용자의 개인정보 수집시 서비스 제공을 위하여 필요한 범위에서 최소한의 개인정보를 수집합니다.</p>
            <p className="text-gray-900">2. 서비스는 회원가입시 구매계약이행에 필요한 정보를 미리 수집하지 않습니다.</p>
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

export default TermsModal;

