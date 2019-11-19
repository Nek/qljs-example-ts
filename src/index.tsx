import * as serviceWorker from './serviceWorker';

import React, { useEffect, useState} from 'react'
import './parsers'
import {init, component, Tag, Params, QLEnv} from 'qljs'
import uuid from 'uuid'
import {isBoolean} from "util";

const Todo = component(['todoId', 'todoText'], (props: QLEnv) => {
    const { todoText, transact } = props
    return (
        <li>
            {todoText}
            {
                <button
                    onClick={() => {
                        transact([['todo_delete']])
                    }}>
                    x
                </button>
            }
        </li>
    )
})

const Description = component(['todoDescription'], ({todoDescription}: QLEnv) => <h1>{todoDescription}</h1>)

const Area = component(['areaId', 'areaTitle', ['areaTodos', Todo]] , (props: QLEnv) => {
    const { areaTitle, areaTodos, render }: QLEnv = props
    return (
        <ul>
            <label key="label">{areaTitle}</label>
            <div>{render(areaTodos, Todo)}</div>
        </ul>
    )
})

const AreaOption = component(['areaId', 'areaTitle'], (props: QLEnv) => {
    const { areaId, areaTitle } = props
    return <option value={areaId.toString()}>{areaTitle}</option>
})

const TodoList = component(
    [['appAreas', Area, AreaOption], 'appLoading'],
    (props: QLEnv) => {
        const { appAreas, appLoading, transact, render } = props

        useEffect(() => {
            transact([['app_init']])
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [])

        const [text, setText] = useState('')
        const [area, setArea] = useState('0')

        return (
            <div>
                {appLoading ? (
                    <div key="loader">Loading...</div>
                ) : (
                    <div key="todo-list">
                        <input onChange={e => setText(e.target.value)} value={text} />
                        <select
                            onChange={e => {
                                setArea(e.target.value.toString())
                            }}>
                            {render(appAreas, AreaOption)}
                        </select>
                        <button
                            onClick={() => {
                                transact([
                                    [
                                        'todo_new',
                                        {
                                            area: area,
                                            text,
                                            id: uuid(),
                                        },
                                    ],
                                ])
                                setText('')
                            }}>
                            Add
                        </button>
                        <ul>{render(appAreas, Area)}</ul>
                    </div>
                )}
            </div>
        )
    },
)


export type TodoState = {
    id: string,
    text: string,
    area: string,
}

export type AreaState = {
    id: string,
    title: string,
}

export type AppState = {
    loading: boolean,
    initialized: boolean,
    todos: TodoState[],
    areas: AreaState[]
}

let state: AppState = {
    loading: true,
    initialized: false,
    todos: [],
    areas: [],
}

const sendMutate = (tag: Tag, params: Params) =>
    fetch('/api', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify([tag, params]),
    })
        .then(response => response.json())
        .then(result => [result])

const remoteHandler = (tag: Tag, params: Params) => {
    const hasTag = new Set(['app_init', 'todo_new', 'todo_delete']).has(tag)

    if (typeof params === 'undefined') {
        return hasTag
    }

    return hasTag ? sendMutate(tag, params) : Promise.resolve([])
}

const mount = init({ state, remoteHandler })

const element = document.getElementById('root');
if (element !== null) {
    mount({
        Component: TodoList,
        element
    })
}

serviceWorker.unregister();
