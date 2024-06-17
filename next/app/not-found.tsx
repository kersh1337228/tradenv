import {
    Metadata
} from 'next';
import NotFound from 'components/misc/errors/404';

export const metadata: Metadata = {
    title: 'Not found'
};

export default async function NotFoundPage() {
    return <main>
        <NotFound />
    </main>;
}
