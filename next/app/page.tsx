import Home from 'components/root/home/Home';
import {
    Metadata
} from 'next';

export const metadata: Metadata = {
    title: 'Home'
};

export default function Page(): React.ReactNode {
    return <Home/>;
}
