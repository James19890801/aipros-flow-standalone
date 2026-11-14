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
    const tokens = [];
    const reg = /(@+)([^@]+)/g;
    let match;

    while ((match = reg.exec(source)) !== null) {
        const level = match[1].length;
        const content = match[2].trim();

        if (!content) continue;

        tokens.push({
        level,
        content,
        raw: match[0],
        index: match.index
        });
    }

    return !!tokens.length;
}