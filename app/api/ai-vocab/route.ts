import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    console.log("========== AI VOCAB START ==========");

    // ==============================
    // KIỂM TRA API KEY
    // ==============================
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error("❌ GEMINI_API_KEY không tồn tại");

      return NextResponse.json(
        {
          error: "Chưa cấu hình GEMINI_API_KEY trong .env.local",
        },
        { status: 500 }
      );
    }

    // ==============================
    // LẤY DỮ LIỆU TỪ FRONTEND
    // ==============================
    const body = await request.json();

    const hanzi =
      typeof body.hanzi === "string"
        ? body.hanzi.trim()
        : "";

    console.log("📚 Hán tự:", hanzi);

    if (!hanzi) {
      return NextResponse.json(
        {
          error: "Vui lòng nhập chữ Hán",
        },
        { status: 400 }
      );
    }

    // ==============================
    // KHỞI TẠO GEMINI
    // ==============================
    const ai = new GoogleGenAI({
      apiKey,
    });

    // ==============================
    // PROMPT NGẮN ĐỂ TĂNG TỐC ĐỘ
    // ==============================
    const prompt = `
Từ tiếng Trung: ${hanzi}

Trả về đúng JSON:

{
  "meaning_vi": "nghĩa tiếng Việt",
  "example_sentence": "câu ví dụ tiếng Trung",
  "example_meaning": "dịch câu ví dụ sang tiếng Việt"
}

Yêu cầu:
- Nghĩa tiếng Việt ngắn gọn.
- Câu ví dụ đơn giản cho người mới học.
- Câu ví dụ bắt buộc chứa từ "${hanzi}".
- Không giải thích.
- Chỉ trả JSON.
`;

    console.log("🤖 Đang gọi Gemini...");

    // ==============================
    // GỌI GEMINI
    // ==============================
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text?.trim();

    console.log("🤖 Gemini trả về:", text);

    if (!text) {
      throw new Error("Gemini không trả về dữ liệu");
    }

    // ==============================
    // PARSE JSON
    // ==============================
    let result;

    try {
      result = JSON.parse(text);
    } catch (error) {
      console.error("❌ JSON lỗi:", error);
      console.error("❌ Gemini raw:", text);

      return NextResponse.json(
        {
          error: "Gemini trả về dữ liệu không đúng JSON",
          raw: text,
        },
        { status: 500 }
      );
    }

    // ==============================
    // KIỂM TRA KẾT QUẢ
    // ==============================
    if (
      !result.meaning_vi ||
      !result.example_sentence ||
      !result.example_meaning
    ) {
      return NextResponse.json(
        {
          error: "Gemini trả về thiếu dữ liệu",
          raw: result,
        },
        { status: 500 }
      );
    }

    console.log("✅ AI hoàn thành");

    // ==============================
    // TRẢ VỀ FRONTEND
    // ==============================
    return NextResponse.json({
      meaning_vi: result.meaning_vi,
      example_sentence: result.example_sentence,
      example_meaning: result.example_meaning,
    });

  } catch (error) {
    console.error("❌❌❌ AI VOCAB ERROR ❌❌❌");
    console.error(error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Lỗi không xác định",
      },
      { status: 500 }
    );
  }
}