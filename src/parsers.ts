import {Params, parseChildren, parseChildrenRemote, parsers, Props, Term} from 'qljs'
import {AppState, AreaState, TodoState} from "./index";

const { read, mutate, remote, sync } = parsers;
// query name
// environment
// state
read('todoText', (term: Term, { todoId }: Props, state: AppState) => {
    const todo = state.todos.find(({ id }: {id: string}) => id === todoId);
    return todo && todo.text
});
read('todoId', (term: Term, { todoId }: Props, state: AppState) => {
    const todo = state.todos.find(({ id }: {id: string}) => id === todoId);
    return todo && todoId
});

read('areaTodos', (term: Term, env: Props, state: AppState) => {
    const { areaId } = env;
    const [, { todoId }] = term;

    if (todoId) {
        return parseChildren(term, { ...env, todoId })
    } else {
        return state.todos
            .filter(({area: id}: { area: string }) => {
                return areaId === id
            })
            .map(({id}: { id: string }) => parseChildren(term, {...env, todoId: id}))
    }
});

read('appAreas', (term: Term, env: Props, state: AppState) => {
    const [, { areaId }] = term;
    if (areaId) {
        return parseChildren(term, { ...env, areaId })
    } else {
        return state.areas.map(({id}: AreaState) => parseChildren(term, {...env, areaId: id}))
    }
});

read('areaTitle', (term: Term, { areaId }: Props, state: AppState) => {
    const area = state.areas.find(({ id }: {id: string}) => id === areaId);
    return area && area.title
});

read('areaId', (term: Term, { areaId }: Props, state: AppState) => {
    const area = state.areas.find(({ id }: {id: string}) => id === areaId);

    return area && areaId
});

read('appLoading', (term: Term, env: Props, state: AppState) => {
    return state.loading
});

mutate('app_init', (term: Term, env: Props, state: AppState) => {
    state.loading = true;
    return state
});

mutate('todo_delete', (term: Term, { areaId, todoId }: Props, state: AppState) => {
    state.todos = [...state.todos.filter(({id}: Params) => id !== todoId)];
    return { todoId }
});

mutate('todo_new', ([key, { area, text, id }]: Term, env: Props, state: AppState) => {
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

remote('todo_new', (term: Term) => {
    return term
});

remote('todo_delete', (term: Term) => {
    return term
});

remote('areaTodos', (term: Term) => {
    return parseChildrenRemote(term)
});

remote('appAreas', (term: Term) => {
    return parseChildrenRemote(term)
});

remote('app_init', (term: Term) => {
    return term
});

sync('appAreas', () => {});

sync('todo_delete', (term: Term) => {
    window.alert(JSON.stringify(term))
});

sync('app_init', (term: Term, result: { todos: TodoState[]; areas: AreaState[]; }, env: Props, state: AppState) => {
    delete state.loading;
        state.todos = result.todos;
        state.areas = result.areas;
});

sync('todo_new', ([tag, { id: todoId }]: Term, result: TodoState, env: Params, state: AppState) => {
    const todo = state.todos.find(({ id }) => id === todoId);
    if (typeof todo !== 'undefined') todo.id = result.id
});
