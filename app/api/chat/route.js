import { NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

// system prompt: so we change it here to automate results based on the input
const systemPrompt = "type in a color and i'll provide info on where that color can be found, type in a word and i'll provide info on the colors that describe it"

export async function POST(req) {
    const data = await req.json() // Parse the JSON body of the incoming request

    try {
        const completion = await groq.chat.completions.create({
            messages: [{ role: 'system', content: systemPrompt }, ...data],
            model: 'mixtral-8x7b-32768', // Specify the model you want to use
        })

        // Create a ReadableStream to handle the response
        const stream = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder()
                try {
                    // Extract content from the response
                    const content = completion.choices[0]?.message?.content || ""
                    controller.enqueue(encoder.encode(content))
                } catch (err) {
                    controller.error(err)
                } finally {
                    controller.close()
                }
            },
        })
        return new NextResponse(stream)
    } catch (error) {
        console.error('Error:', error)
        return new NextResponse(
            new ReadableStream({
                start(controller) {
                    controller.enqueue(new TextEncoder().encode("I'm sorry, but I encountered an error. Please try again later."))
                    controller.close()
                }
            }),
            { status: 500 }
        )
    }
}
