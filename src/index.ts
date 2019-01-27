import { always, pipe, UnaryFunction } from '@kofno/piper';

export interface Ok<A> {
  kind: 'ok';
  value: A;
}

export interface Err<E> {
  kind: 'err';
  failure: E;
}

export type Result<E, A> = Ok<A> | Err<E>;

export function ok<E, A>(value: A): Result<E, A> {
  return {
    kind: 'ok',
    value,
  };
}

export function err<E, A>(failure: E): Result<E, A> {
  return {
    kind: 'err',
    failure,
  };
}

export interface Catamorphism<E, A, B> {
  ok: (a: A) => B;
  err: (failure: E) => B;
}

export function cata<E, A, B>(matcher: Catamorphism<E, A, B>): (result: Result<E, A>) => B;
export function cata<E, A, B>(matcher: Catamorphism<E, A, B>, result: Result<E, A>): B;
export function cata<E, A, B>(matcher: Catamorphism<E, A, B>, result?: Result<E, A>) {
  const fold = (result: Result<E, A>) => {
    switch (result.kind) {
      case 'ok':
        return matcher.ok(result.value);
      case 'err':
        return matcher.err(result.failure);
    }
  };

  return typeof result === 'undefined' ? fold : fold(result);
}

export function andThen<E, A, B>(
  fn: (a: A) => Result<E, B>,
): (result: Result<E, A>) => Result<E, B>;
export function andThen<E, A, B>(fn: (a: A) => Result<E, B>, result: Result<E, A>): Result<E, B>;
export function andThen<E, A, B>(fn: (a: A) => Result<E, B>, result?: Result<E, A>) {
  const mapper = (result: Result<E, A>) => {
    switch (result.kind) {
      case 'ok':
        return fn(result.value);
      case 'err':
        return result;
    }
  };

  return typeof result === 'undefined' ? mapper : mapper(result);
}

export function map<E, A, B>(fn: (a: A) => B): (result: Result<E, A>) => Result<E, B>;
export function map<E, A, B>(fn: (a: A) => B, result: Result<E, A>): Result<E, B>;
export function map<E, A, B>(fn: (a: A) => B, result?: Result<E, A>) {
  const makeItSo = pipe(
    fn,
    ok,
  ) as UnaryFunction<A, Result<E, B>>;

  return typeof result === 'undefined' ? andThen(makeItSo) : andThen(makeItSo, result);
}

export function orElse<E1, E2, A>(
  fn: (e: E1) => Result<E2, A>,
): (result: Result<E1, A>) => Result<E2, A>;
export function orElse<E1, E2, A>(
  fn: (e: E1) => Result<E2, A>,
  result: Result<E1, A>,
): Result<E2, A>;
export function orElse<E1, E2, A>(fn: (e: E1) => Result<E2, A>, result?: Result<E1, A>) {
  const mapper = (result: Result<E1, A>) => {
    switch (result.kind) {
      case 'ok':
        return result;
      case 'err':
        return fn(result.failure);
    }
  };

  return typeof result === 'undefined' ? mapper : mapper(result);
}

export function mapError<E1, E2, A>(fn: (e: E1) => E2): (result: Result<E1, A>) => Result<E2, A>;
export function mapError<E1, E2, A>(fn: (e: E1) => E2, result: Result<E1, A>): Result<E2, A>;
export function mapError<E1, E2, A>(fn: (e: E1) => E2, result?: Result<E1, A>) {
  const makeItSo = pipe(
    fn,
    err,
  ) as UnaryFunction<E1, Result<E2, A>>;

  return typeof result === 'undefined' ? orElse(makeItSo) : orElse(makeItSo, result);
}

export function lazyUnwrap<E, A>(defaultProvider: () => A): (result: Result<E, A>) => A;
export function lazyUnwrap<E, A>(defaultProvider: () => A, result: Result<E, A>): A;
export function lazyUnwrap<E, A>(defaultProvider: () => A, result?: Result<E, A>) {
  const unwrapper = (result: Result<E, A>) => {
    switch (result.kind) {
      case 'ok':
        return result.value;
      case 'err':
        return defaultProvider();
    }
  };

  return typeof result === 'undefined' ? unwrapper : unwrapper(result);
}

export function unwrap<E, A>(defaultValue: A): (result: Result<E, A>) => A;
export function unwrap<E, A>(defaultValue: A, result: Result<E, A>): A;
export function unwrap<E, A>(defaultValue: A, result?: Result<E, A>) {
  const unwrapper = lazyUnwrap<E, A>(always(defaultValue));
  return typeof result === 'undefined' ? unwrapper : unwrapper(result);
}
