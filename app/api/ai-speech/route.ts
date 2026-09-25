// app/api/ai-speech/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { targetHanzi, targetPinyin, spokenText } = await req.json();

    if (!targetHanzi || !spokenText) {
      return NextResponse.json({ error: 'Thiếu dữ liệu để chấm điểm' }, { status: 400 });
    }

    const cleanTarget = targetHanzi.trim();
    const cleanSpoken = spokenText.trim();

    // Khớp 100% không cần tốn API AI
    if (cleanTarget === cleanSpoken) {
      return NextResponse.json({
        score: 100,
        feedback: 'Phát âm chuẩn xác tuyệt đối! 🎉',
        suggestion: 'Bạn nói rất chuẩn, hãy tiếp tục phát huy ở các từ tiếp theo.',
      });
    }

    // Nếu khác biệt, gọi AI chấm điểm & đưa ra nhận xét
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      const prompt = `
Bạn là một giáo viên tiếng Trung chuẩn. Hãy chấm điểm phát âm của học viên.
- Chữ Hán gốc: "${cleanTarget}" (Pinyin: ${targetPinyin || 'N/A'})
- Chữ Hán nghe được từ học viên: "${cleanSpoken}"

Hãy trả về định dạng JSON duy nhất:
{
  "score": <số điểm từ 0 đến 90 dựa vào độ tương đồng>,
  "feedback": "<nhận xét ngắn bằng tiếng Việt giải thích lý do sai thanh điệu hoặc phụ âm>",
  "suggestion": "<lời khuyên cụ thể để đọc đúng hơn>"
}`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
        }),
      });

      const data = await response.json();
      if (data.choices?.[0]?.message?.content) {
        const result = JSON.parse(data.choices[0].message.content);
        return NextResponse.json(result);
      }
    }

    // Dự phòng khi không có API Key
    return NextResponse.json({
      score: 60,
      feedback: `Máy nghe được: "${cleanSpoken}" (Khác với "${cleanTarget}")`,
      suggestion: 'Hãy chú ý đọc rõ thanh điệu và bật hơi đúng các phụ âm.',
    });
  } catch (error) {
    console.error('AI Speech Error:', error);
    return NextResponse.json(
      { score: 50, feedback: 'Không thể kết nối AI chấm điểm', suggestion: 'Vui lòng thử lại sau.' },
      { status: 500 }
    );
  }
}