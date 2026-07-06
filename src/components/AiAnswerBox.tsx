import './AiAnswerBox.css'

interface AiAnswerBoxProps {
    question: string;
    answer: string;
}

// AEO (answer-engine-optimization) bloğu: LLM/AI arama botlarının sayfanın
// tamamını parse etmeden tek bakışta alıntılayabileceği kısa soru-cevap özeti.
// Her sayfanın hero'sundan hemen sonra render edilir.
export default function AiAnswerBox({ question, answer }: AiAnswerBoxProps) {
    if (!question || !answer) return null;

    return (
        <div className="ai-answer-box" role="note">
            <div className="ai-answer-eyebrow">
                <span className="ai-answer-icon" aria-hidden="true">⚡</span>
                {question}
            </div>
            <p className="ai-answer-text">{answer}</p>
        </div>
    )
}
