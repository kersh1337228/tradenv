import React from 'react';
import {
    Metadata
} from 'next';
import Header from 'src/components/root/header/Header';
import Footer from 'src/components/root/footer/Footer';
import './global.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
    title: {
        template: '%s',
        default: 'tradenv',
    },
    description: 'Trading strategies testing environment based on open stock market data'
};

export default async function RootLayout(
    {
        children
    }: {
        children: React.ReactNode
    }
) {
    return (
        <html
            lang='en'
        >
            <body>
                <Header />
                {children}
                <Footer />
            </body>
        </html>
    );
}
