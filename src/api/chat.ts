import request from '../utils/request'
import type {
  ApiResponse,
  ChatData,
  ChatSessionListData,
  SessionMessagesData,
  SSEEvent,
} from '../types/api'

export async function sendMessage(
  courseId: string,
  params: {
    question: string
    session_id?: string
    section_id?: string
  },
): Promise<ApiResponse<ChatData>> {
  const res = await request.post(
    `/student/courses/${courseId}/chat`,
    params,
  )
  return res as unknown as ApiResponse<ChatData>
}

export async function getChatSessions(
  courseId: string,
  params?: { section_id?: string },
): Promise<ApiResponse<ChatSessionListData>> {
  const res = await request.get(
    `/student/courses/${courseId}/chat/sessions`,
    { params },
  )
  return res as unknown as ApiResponse<ChatSessionListData>
}

export async function getSessionMessages(
  courseId: string,
  sessionId: string,
): Promise<ApiResponse<SessionMessagesData>> {
  const res = await request.get(
    `/student/courses/${courseId}/chat/sessions/${sessionId}/messages`,
  )
  return res as unknown as ApiResponse<SessionMessagesData>
}

/**
 * 流式问答 — 使用 fetch + ReadableStream 解析 SSE 事件。
 * 返回一个异步生成器，逐条 yield SSEEvent。
 * 调用方可通过 AbortController 中断流。
 */
export async function* streamMessage(
  courseId: string,
  params: {
    question: string
    session_id?: string
    section_id?: string
  },
  signal?: AbortSignal,
): AsyncGenerator<SSEEvent> {
  const token = localStorage.getItem('token')
  // 使用 Vite 代理，相对路径即可
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api'
  const url = `${baseUrl}/student/courses/${courseId}/chat/stream`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(params),
    signal,
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    throw new Error(errorText || `HTTP ${response.status}`)
  }

  if (!response.body) {
    throw new Error('浏览器不支持流式响应')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      // 保留最后一个可能不完整的行
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith('data: ')) continue

        const jsonStr = trimmed.slice(6) // 去掉 "data: " 前缀
        try {
          const event = JSON.parse(jsonStr) as SSEEvent
          yield event
        } catch {
          // 跳过无法解析的行
        }
      }
    }

    // 处理缓冲区剩余内容
    if (buffer.trim().startsWith('data: ')) {
      const jsonStr = buffer.trim().slice(6)
      try {
        const event = JSON.parse(jsonStr) as SSEEvent
        yield event
      } catch {
        // 跳过
      }
    }
  } finally {
    reader.releaseLock()
  }
}

/**
 * Mock 模式下的模拟流式 — 用 setTimeout 逐段 yield，模拟打字机效果。
 */
export async function* mockStreamMessage(
  _courseId: string,
  params: { question: string; session_id?: string },
  _signal?: AbortSignal,
): AsyncGenerator<SSEEvent> {
  const sessionId = params.session_id || `mock_session_${Date.now()}`
  const question = params.question.replace(/[？?]/g, '')

  // meta 事件
  yield {
    type: 'meta',
    session_id: sessionId,
    rag_used: true,
    references: [
      {
        section_id: 'section_001',
        section_title: '课程参考资料',
        file_name: 'course_material.pdf',
        excerpt: '相关课程材料摘录...',
      },
    ],
  }

  // 模拟 AI 回答（含 Markdown 格式）
  const answer = `关于 **"${question}"** 这个问题，以下是详细解答：\n\n## 基本概念\n\n首先需要理解相关的定义和核心原理。这是一个非常重要的知识点，我们来逐步分析。\n\n## 关键要点\n\n1. **理解基本概念和定义** — 这是学习的第一步\n2. **掌握关键特征和属性** — 深入理解本质\n3. **注意与其他知识点的关联** — 建立知识网络\n\n## 代码示例\n\n\`\`\`python\ndef hello_world():\n    print("Hello, World!")\n    return True\n\`\`\`\n\n## 应用场景\n\n> 这些知识在实际工程中有广泛的应用，特别是在系统设计和性能优化方面。\n\n| 场景 | 应用 | 效果 |\n|------|------|------|\n| Web开发 | 缓存机制 | 提升响应速度 |\n| 数据处理 | 批处理 | 提高吞吐量 |\n\n希望这个解答对你有帮助！如有疑问欢迎继续追问。`

  // 将回答按固定长度切片输出，模拟打字机效果
  const chunkSize = 3 // 每次输出 3 个字符
  for (let i = 0; i < answer.length; i += chunkSize) {
    const chunk = answer.slice(i, i + chunkSize)
    // 检查是否需要中断
    if (_signal?.aborted) break
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(resolve, 30)
      // 支持中断
      if (_signal) {
        _signal.addEventListener('abort', () => {
          clearTimeout(timer)
          reject(new DOMException('Aborted', 'AbortError'))
        }, { once: true })
      }
    })
    yield { type: 'delta', content: chunk }
  }

  // done 事件
  yield { type: 'done' }
}
