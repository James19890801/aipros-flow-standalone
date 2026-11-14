/**
 * 去掉可选的 markdown 代码围栏（如 ```json ... ```），便于识别内层 DSL
 * @param {string} str
 * @returns {string}
 */
function stripMarkdownFence(str) {
    let s = str.trim()
    if (!s.startsWith('```')) {
        return s
    }
    s = s.replace(/^```[a-zA-Z0-9_-]*\s*/m, '')
    s = s.replace(/```\s*$/m, '').trim()
    return s
}

// 是否为流程图编辑器可直接插入的完整 POS 画布定义。
function isPosCanvasDefinition(source) {
    if (!source || source[0] !== '{' ||
        !source.includes('"elements"') || !source.includes('"page"') || !source.includes('"version"')) {
        return false
    }
    try {
        const data = JSON.parse(source)
        if (!data || Array.isArray(data) || typeof data !== 'object') {
            return false
        }
        const elements = data.elements
        const shapes = elements && !Array.isArray(elements) && typeof elements === 'object'
            ? Object.values(elements)
            : []
        return shapes.length > 0 &&
            data.page && !Array.isArray(data.page) && typeof data.page === 'object' &&
            Object.prototype.hasOwnProperty.call(data, 'version') &&
            shapes.every(shape => shape && typeof shape === 'object' && shape.id && shape.name && shape.props)
    } catch (error) {
        return false
    }
}

// 是否为脑图图片还原返回的根节点 POS 定义。
function isMindmapPosDefinition(source) {
    if (!source || source[0] !== '{' || !source.includes('"children"')) {
        return false
    }
    try {
        const data = JSON.parse(source)
        return data && !Array.isArray(data) && data.id === 'root' && Array.isArray(data.children)
    } catch (error) {
        return false
    }
}
const PO_TYPE_SET = new Set([
  "equityPiercing",
  "legalRelation"
])

// 是否是smart图形dsl
function inferDslSmartType(dsl) {

  if (typeof dsl !== 'string') {
    return '';
  }

  const supportedTypes = new Set([
    'infographic',
    'list',
    'process',
    'relationship',
    'timeline',
    'orgchart',
    'pyramid',
    'visual',
  ]);

  const normalizeType = (rawType) => {
    if (
      rawType === 'infographic' ||
      rawType === 'list' ||
      rawType === 'process' ||
      rawType === 'relationship'
    ) {
      return 'sample';
    }

    if (
      rawType === 'timeline' ||
      rawType === 'orgchart' ||
      rawType === 'pyramid' ||
      rawType === 'visual'
    ) {
      return rawType;
    }

    return '';
  };

  const normalized = dsl.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const lines = normalized.split('\n');

  for (let i = 0; i < lines.length; i += 1) {
    const trimmed = lines[i].trim();

    if (!trimmed || trimmed.startsWith('%%')) {
      continue;
    }

    if (/^smart\s*$/i.test(trimmed)) {
      return 'sample';
    }

    const match = trimmed.match(/^smart\s+([^\s]+)\b/i);

    if (!match) {
      return '';
    }

    const rawType = match[1].trim().toLowerCase();

    if (!supportedTypes.has(rawType)) {
      return '';
    }

    return normalizeType(rawType);
  }

  return '';
}

function parsePoMermaid(code) {
  const directiveRegex = /%%\{([\s\S]*?)\}%%/

  const match = code.match(directiveRegex)
  if (!match) {
    return { isPo: false, type: null }
  }

  const raw = match[1].trim()

  try {
    // ⚠️ 兼容压缩 / 非压缩
    const obj = new Function(
      `return ({${raw}})`
    )()

    const po = obj?.po
    if (!po) {
      return { isPo: false, type: null }
    }

    const type = typeof po === "string" ? po : po.type

    // ✅ 白名单校验（关键）
    if (!PO_TYPE_SET.has(type)) {
      return { isPo: false, type: null }
    }

    return {
      isPo: true,
      type
    }
  } catch (e) {
    return { isPo: false, type: null }
  }
}
/**
 * 根据单条 DSL 内容推断图形类型（⚠️智能图形外部调用，不可移动/删除）
 * @param {string} dsl
 * @returns {string|undefined} type，无法识别时返回 undefined
 */
export function inferDslType(dsl = '') {
    if (!dsl || typeof dsl !== 'string') {
        return
    }

    const source = dsl.trim()
    if (!source) {
        return
    }

    const lower = source.toLowerCase()
    const archBody = stripMarkdownFence(source)
    // structure 注释声明的是 Markdown 脑图；流式时无需等注释闭合，避免正文关键词触发其他类型。
    if (/^<!--\s*structure\s*=/i.test(archBody)) {
        return
    }

    // JSON 结构类 DSL（纯 JSON，或 ``` / ```json 等围栏包裹；流式时可能紧贴 ```json{）
    if (archBody[0] === '{' && /"type"\s*:\s*"genericGraph"/i.test(archBody)) {
        return 'genericGraph'
    }
    if (archBody[0] === '{' && /"template"\s*:\s*"arch-/i.test(archBody)) {
        return 'architectureDiagram'
    }
    if (isPosCanvasDefinition(archBody)) {
        return 'pos'
    }
    if (isMindmapPosDefinition(archBody)) {
        return 'mindmap'
    }

    if (/^\s*swimlane(?:-diagram\b|\s*$)/m.test(source)) {
        return 'swimlane'
    }

    const isPoMermaid = parsePoMermaid(source)
    if (isPoMermaid.isPo) {
        return isPoMermaid.type
    }
    const smartType = inferDslSmartType(source)
    if (smartType) {
        return smartType
    }
    // Mermaid 类 DSL（优先判断，避免与后面的 markdown 类冲突）
    if (/\bsequencediagram\b/i.test(lower)) {
        return 'sequence'
    }
    if (/\berdiagram\b/i.test(lower)) {
        return 'erDiagram'
    }
    if (/\bclassdiagram\b/i.test(lower)) {
        return 'classDiagram'
    }
    if (/\bstateDiagram(?:-v2)?\b/i.test(source)) {
        return 'stateDiagram'
    }
    /*if (/^\s*timeline\b/m.test(lower)) {
        return 'timeline'
    }*/
    if (/^\s*gantt-simple\b/m.test(lower) || /^\s*gantt\b/m.test(lower) || /^\s*dateformat\b/m.test(lower)) {
        return 'gantt'
    }
    if (/\bgraph\s+(?:tb|bt|lr|rl|td)\b/i.test(source) || /^\s*flowchart\b/m.test(lower)) {
        return 'flowchart'
    }

    // 容易混淆的 markdown 层级类 DSL：放最后判断
    const lines = source.split('\n').map(item => item.trim()).filter(Boolean)
    const titleLine = (lines.find(item => /^#\s*/.test(item)) || '').replace(/^#\s*/, '').toLowerCase()
    const h2Lines = lines.filter(item => /^##\s*/.test(item)).map(item => item.replace(/^##\s*/, '').toLowerCase())
    const h4Count = lines.filter(item => /^####\s*\S+/.test(item)).length

    // 流式场景下，标题常先到达：优先用强语义关键词快速识别
    if (/(^|[^a-z])swot([^a-z]|$)|swot分析/i.test(titleLine)) {
        return 'swot'
    }
    if (/(^|[^a-z])pest([^a-z]|$)|pest分析/i.test(titleLine)) {
        return 'pest'
    }

    const swotRules = [
        /(优势|strengths?)/i,
        /(劣势|weaknesses?)/i,
        /(机会|opportunities?)/i,
        /(威胁|threats?)/i
    ]
    const pestRules = [
        /(政治|politic(?:al)?)/i,
        /(经济|economic)/i,
        /(社会|social)/i,
        /(技术|technolog(?:y|ical))/i
    ]
    const swotHitCount = swotRules.reduce((count, rule) => count + (h2Lines.some(item => rule.test(item)) ? 1 : 0), 0)
    const pestHitCount = pestRules.reduce((count, rule) => count + (h2Lines.some(item => rule.test(item)) ? 1 : 0), 0)
    const pestEarlyHit = h2Lines.some(item => /(政治|经济|社会|技术).*(要素|因素)/i.test(item) || /(political|economic|social|technolog(?:y|ical)).*factor/i.test(item))

    if (swotHitCount === 4) {
        return 'swot'
    }

    if (pestHitCount === 4) {
        return 'pest'
    }

    // 流式半成品：出现了 pest/swot 的早期信号时，不让 orgchart 抢先误判
    if (swotHitCount > 0 && pestHitCount === 0) {
        return 'swot'
    }
    if (pestEarlyHit && swotHitCount === 0) {
        return 'pest'
    }

    // markdown 多级标题结构（# / ## / ###）更偏组织架构
    // 为避免流式误判，orgchart 触发门槛提高：
    // - 存在 4 级标题，或
    // - 二级标题数量 >= 3（更像部门树结构）
    /*const hasOrgchartStructure = /^#\s*\S+/m.test(source) && /^##\s*\S+/m.test(source) && /^###\s*\S+/m.test(source)
    if (hasOrgchartStructure && (h4Count > 0 || h2Lines.length >= 3)) {
        return 'orgchart'
    }*/
}
