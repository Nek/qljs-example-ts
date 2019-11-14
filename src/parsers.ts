import {parseChildren, parseChildrenRemote, parsers, Term, Env, Params, Json, QLProps} from 'qljs'
const { read, mutate, remote, sync } = parsers
// query name
// environment
// state
read('todoText', (term: Term, { todoId }: QLProps, state: any) => {
    const todo = state.todos.find(({ id }: {id: string}) => id === todoId)
    const text = todo && todo.text
    return text
})
read('todoId', (term: Term, { todoId }: QLProps, state: any) => {
    const todo = state.todos.find(({ id }: {id: string}) => id === todoId)
    return todo && todoId
})

read('areaTodos', (term: Term, env: QLProps, state: any) => {
    const { areaId } = env
    const [, { todoId }] = term

    if (todoId) {
        return parseChildren(term, { ...env, todoId })
    } else {
        const res = state.todos
            .filter(({ area: id }: Params) => {
                console.log(typeof areaId, typeof id)
                return areaId === id
            })
            .map(({ id }: Params) => parseChildren(term, { ...env, todoId: id }))
        return res
    }
})

read('appAreas', (term: Term, env: QLProps, state: any) => {
    const [, { areaId }] = term
    if (areaId) {
        return parseChildren(term, { ...env, areaId })
    } else {
        const res = state.areas.map(({ id }: Params) => {
            const res = parseChildren(term, { ...env, areaId: id })
            return res
        })
        return res
    }
})

read('areaTitle', (term: Term, { areaId }: QLProps, state: any) => {
    const area = state.areas.find(({ id }: Params) => id === areaId)
    return area && area.title
})

read('areaId', (term: Term, { areaId }: QLProps, state: any) => {
    const area = state.areas.find(({ id }: Params) => id === areaId)

    return area && areaId
})

read('appLoading', (term: Term, env: QLProps, state: any) => {
    return state.loading
})

mutate('app_init', (term: Term, env: QLProps, state: any) => {
    state.loading = true
    return state
})

mutate('todo_delete', (term: Term, { areaId, todoId }: QLProps, state: any) => {
    const newTodos = [...state.todos.filter(({ id }: Params) => id !== todoId)]
    state.todos = newTodos
    return { todoId }
})

mutate('todo_new', ([key, { area, text, id }]: Term, env: QLProps, state: any) => {
    const todo = state.todos.find(({ id: todoId }: Params) => id === todoId)
    state.todos.push((todo && { ...todo, area, text }) || { id, text, area })
    return { id }
})

remote('todo_new', (term: Term, state: any) => {
    return term
})

remote('todo_delete', (term: Term, state: any) => {
    return term
})

remote('areaTodos', (term: Term, state: any) => {
    return parseChildrenRemote(term)
})

remote('appAreas', (term: Term, state: any) => {
    return parseChildrenRemote(term)
})

remote('app_init', (term: Term, state: any) => {
    return term
})

sync('appAreas', (term: Term, result: Json, env: Params, state: any) => {})

sync('todo_delete', (term: Term, result: Json, env: Params, state: any) => {
    window.alert(JSON.stringify(term))
})

sync('app_init', (term: Term, result: Params, env: QLProps, state: any) => {
    delete state.loading
    state.todos = result.todos
    state.areas = result.areas
})

sync('todo_new', ([tag, { id: todoId }]: Term, { id }: Params, env: Params, state: any) => {
    const todo = state.todos.find(({ id }: Params) => id === todoId)
    todo.id = id
})
