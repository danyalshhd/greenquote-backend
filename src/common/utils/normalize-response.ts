export function ok<T>(data: T, message = 'OK') {
  return { status: 200, success: true, message, data };
}

export function created<T>(data: T, message = 'Created') {
  return { status: 201, success: true, message, data };
}
