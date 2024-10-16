import Sidenav from "@/components/sidenav";
import {useAuth} from "@/app/hooks/auth";
import Loading from "@/app/(home)/loading";


export default function AppLayout({children}: {children: React.ReactNode}) {
    const { user } = useAuth({ middleware: 'auth' })

    if (!user) {
        return <Loading />
    }

    return (
        <div className="flex h-screen flex-col md:flex-row md:overflow-hidden">
            <div className="w-full flex-none md:w-64">
                <Sidenav user={user}/>
            </div>
            <div className="flex-grow p-6 md:overflow-y-auto md:p-12">{children}</div>
        </div>
    )
}