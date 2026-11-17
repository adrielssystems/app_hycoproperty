import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      unitNumber = 'Suite',
      unitType = 'Commercial Space',
      areaSqft = 1200,
      rentPrice = 2500,
      notes = '',
      language = 'en',
    } = body;

    const apiKey = process.env.OPENAI_API_KEY;

    if (apiKey) {
      const prompt =
        language === 'es'
          ? `Redacta una descripción comercial profesional y neutra (sin modismos ni spanglish) para un inmueble en EE.UU.:\n- Unidad: ${unitNumber}\n- Tipo: ${unitType}\n- Área: ${areaSqft} sq ft\n- Renta mensual base: $${rentPrice} USD\n- Notas adicionales: ${notes || 'Acceso directo, estacionamiento amplio, listo para ocupación.'}\nMáximo 3 oraciones claras y ejecutivas.`
          : `Write a polished, formal U.S. commercial real estate listing description (clear, neutral English):\n- Unit: ${unitNumber}\n- Space Type: ${unitType}\n- Area: ${areaSqft} sq ft\n- Base Monthly Rent: $${rentPrice} USD\n- Additional Notes: ${notes || 'Direct ground-level access, ample parking, move-in ready.'}\nKeep it concise (max 3 sentences).`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content:
                'You are an executive commercial real estate copywriter for HYCO Property Management in Indianapolis, IN.',
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.6,
          max_tokens: 220,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content?.trim();
        if (text) {
          return NextResponse.json({ success: true, description: text, source: 'openai' });
        }
      }
    }

    // Executive fallback template when OPENAI_API_KEY is not set
    const fallbackDescription =
      language === 'es'
        ? `${unitNumber} ofrece ${Number(areaSqft).toLocaleString()} pies cuadrados de espacio tipo ${unitType} en una ubicación estratégica comercial e industrial en Indianápolis. Diseñado para operaciones eficientes con acceso a nivel de calle, estacionamiento exclusivo y renta base de $${Number(rentPrice).toLocaleString()} USD mensuales.${notes ? ` Características destacadas: ${notes}.` : ''}`
        : `${unitNumber} offers ${Number(areaSqft).toLocaleString()} sq ft of prime ${unitType} space in a strategic Indianapolis commercial corridor. Engineered for operational efficiency with ground-level access, dedicated parking, and a competitive base rent of $${Number(rentPrice).toLocaleString()}/month.${notes ? ` Key highlights: ${notes}.` : ''}`;

    return NextResponse.json({
      success: true,
      description: fallbackDescription,
      source: 'template',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'AI description generation failed' },
      { status: 500 }
    );
  }
}
