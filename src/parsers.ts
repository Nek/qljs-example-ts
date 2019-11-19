import {parseChildren, parseChildrenRemote, parsers, Term, Params, Json, QLEnv} from 'qljs'
import {AppState, AreaState, TodoState} from "./index";
const { read, mutate, remote, sync } = parsers;
// query name
// environment
// state
read('todoText', (term: Term, { todoId }: QLEnv, state: AppState) => {
    const todo = state.todos.find(({ id }: {id: string}) => id === todoId);
    const text = todo && todo.text;
    return text
});
read('todoId', (term: Term, { todoId }: QLEnv, state: AppState) => {
    const todo = state.todos.find(({ id }: {id: string}) => id === todoId);
    return todo && todoId
});

read('areaTodos', (term: Term, env: QLEnv, state: AppState) => {
    const { areaId } = env;
    const [, { todoId }] = term;

    if (todoId) {
        return parseChildren(term, { ...env, todoId })
    } else {
        const res = state.todos
            .filter(({ area: id }: {area: string}) => {
                return areaId === id
            })
            .map(({ id }: { id: string}) => parseChildren(term, { ...env, todoId: id }));
        return res
    }
});

read('appAreas', (term: Term, env: QLEnv, state: AppState) => {
    const [, { areaId }] = term;
    if (areaId) {
        return parseChildren(term, { ...env, areaId })
    } else {
        const res = state.areas.map(({ id }: AreaState) => {
            const res = parseChildren(term, { ...env, areaId: id });
            return res
        });
        return res
    }
});

read('areaTitle', (term: Term, { areaId }: QLEnv, state: AppState) => {
    const area = state.areas.find(({ id }: {id: string}) => id === areaId);
    return area && area.title
});

read('areaId', (term: Term, { areaId }: QLEnv, state: AppState) => {
    const area = state.areas.find(({ id }: {id: string}) => id === areaId);

    return area && areaId
});

read('appLoading', (term: Term, env: QLEnv, state: AppState) => {
    return state.loading
});

mutate('app_init', (term: Term, env: QLEnv, state: AppState) => {
    state.loading = true;
    return state
});

mutate('todo_delete', (term: Term, { areaId, todoId }: QLEnv, state: AppState) => {
    const newTodos = [...state.todos.filter(({ id }: Params) => id !== todoId)];
    state.todos = newTodos;
    return { todoId }
});

mutate('todo_new', ([key, { area, text, id }]: Term, env: QLEnv, state: AppState) => {
    const todo = state.todos.find(({ id: todoId }: TodoState) => id === todoId);
    if (
        typeof area === 'string' &&
        typeof text === 'string'
    ) {
    if (
        typeof todo !== 'undefined'
    ) {
        state.todos.push({...todo, area, text})
    } else
        if (typeof id === 'string') {

            state.todos.push( { id, text, area })
    }}
    return { id }
});

remote('todo_new', (term: Term, state: AppState) => {
    return term
});

remote('todo_delete', (term: Term, state: AppState) => {
    return term
});

remote('areaTodos', (term: Term, state: AppState) => {
    return parseChildrenRemote(term)
});

remote('appAreas', (term: Term, state: AppState) => {
    return parseChildrenRemote(term)
});

remote('app_init', (term: Term, state: AppState) => {
    return term
});

sync('appAreas', (term: Term, result: AreaState[], env: QLEnv, state: AppState) => {});

sync('todo_delete', (term: Term, result: TodoState, env: QLEnv, state: AppState) => {
    window.alert(JSON.stringify(term))
});

sync('app_init', (term: Term, result: { todos: TodoState[]; areas: AreaState[]; }, env: QLEnv, state: AppState) => {
    delete state.loading;
        state.todos = result.todos;
        state.areas = result.areas
});

sync('todo_new', ([tag, { id: todoId }]: Term, result: TodoState, env: Params, state: AppState) => {
    const todo = state.todos.find(({ id }) => id === todoId);
    if (typeof todo !== 'undefined') todo.id = result.id
});
