// 세션·포인트 로직 셀프 체크 — `node src/lib/session.check.ts`
import assert from 'node:assert/strict'
import { finish, formatClock, pause, pointsFor, remainingOf, restore, resume, start, tick } from './session.ts'
import { validateEmail, validateNickname } from './validation.ts'

const MIN = 60_000

// 포인트: 10분 미만 0P, 이후 10분마다 500P (10분 단위 미만 버림)
assert.equal(pointsFor(9 * MIN + 59_000), 0)
assert.equal(pointsFor(10 * MIN), 500)
assert.equal(pointsFor(24 * MIN + 50_000), 1000)

// 일시정지한 시간은 공부 시간에서 빠진다
let s = start(25, 0)
s = pause(s, 5 * MIN)
s = resume(s, 15 * MIN)
assert.equal(remainingOf(s, 20 * MIN), 15 * MIN)
assert.equal(s.pauseCount, 1)

// 목표를 채우면 완료 대기로 고정, 이후 시간이 흘러도 그대로
s = tick(s, 40 * MIN)
assert.equal(s.status, 'reached')
assert.equal(remainingOf(s, 99 * MIN), 0)
const done = finish(s, 99 * MIN)
assert.deepEqual([done.earned, done.completed], [1000, true])

// 중도 종료: 공부한 만큼
const early = finish(start(50, 0), 24 * MIN + 50_000)
assert.deepEqual([early.earned, early.completed], [1000, false])

// 새로고침이면 그대로 진행
const running = start(25, 0)
assert.equal(restore(running, true, 3 * MIN), running)

// 탭을 닫았다 열면 마지막 활성 시각에 일시정지
const reopened = restore(running, false, 3 * MIN)
assert.equal(reopened.status, 'paused')
assert.equal(reopened.status === 'paused' && remainingOf(reopened, 60 * MIN), 22 * MIN)

// 닫혀 있던 사이 목표를 채웠으면 완료 대기
assert.equal(restore(running, false, 30 * MIN).status, 'reached')

assert.equal(formatClock(24 * MIN + 13_000), '24:13')
assert.equal(formatClock(500), '00:01')

// 회원가입 검증 문구는 백엔드와 동일
assert.equal(validateEmail('not-an-email'), '이메일 형식이 올바르지 않습니다')
assert.equal(validateNickname('a'), '닉네임은 2~10자여야 합니다')
assert.equal(validateNickname('라떼'), null)

console.log('session check: ok')
