import {
    NextRequest,
    NextResponse
} from 'next/server';

export async function middleware(
    _: NextRequest
): Promise<NextResponse<unknown>> {
    return NextResponse.next();
}
