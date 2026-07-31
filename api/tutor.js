module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido." });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({
      error: "A variável OPENAI_API_KEY não está configurada na Vercel.",
    });
  }

  try {
    const { subject = "estudos", messages = [] } = req.body || {};
    const conversation = messages
      .slice(-12)
      .map(({ who, text }) => {
        const speaker = who === "ai" ? "Tutor" : "Aluno";
        return `${speaker}: ${String(text || "").slice(0, 1500)}`;
      })
      .join("\n");

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-5-mini",
        input: `Você é um tutor de ${subject} para estudantes brasileiros de vestibular. Responda em português, de forma didática, objetiva e acolhedora.\n\nConversa:\n${conversation}`,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || `OpenAI retornou status ${response.status}`);
    }

    return res.status(200).json({
      reply: data.output_text || "Não consegui gerar uma resposta agora.",
    });
  } catch (error) {
    console.error("Erro em /api/tutor:", error.message);
    return res.status(500).json({
      error: "Não foi possível obter a resposta do tutor.",
    });
  }
};
