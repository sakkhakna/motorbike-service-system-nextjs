import useSWR from 'swr'
import axios from "axios";
import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

interface AuthProps {
    middleware?: 'guest' | 'auth';
    redirectIfAuthenticated?: string;
}

interface RegisterProps {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    setErrors: React.Dispatch<React.SetStateAction<string[]>>;
}

interface LoginProps {
    email: string;
    password: string;
    setErrors: React.Dispatch<React.SetStateAction<string[]>>;
    setStatus: React.Dispatch<React.SetStateAction<string | null>>;
}

interface ForgotPasswordProps {
    email: string;
    setErrors: React.Dispatch<React.SetStateAction<string[]>>;
    setStatus: React.Dispatch<React.SetStateAction<string | null>>;
}

interface ResetPasswordProps {
    email: string;
    password: string;
    password_confirmation: string;
    setErrors: React.Dispatch<React.SetStateAction<string[]>>;
    setStatus: React.Dispatch<React.SetStateAction<string | null>>;
}

export const useAuth = ({ middleware, redirectIfAuthenticated }: AuthProps = {}) => {
    const router = useRouter()
    const params = useParams()

    const { data: user, error, mutate } = useSWR('/api/user', () =>
        axios
            .get('/api/user')
            .then(res => res.data)
            .catch(error => {
                if (error.response?.status !== 409) throw error

                router.push('/verify-email')
            }),
    )

    const csrf = () => axios.get('/sanctum/csrf-cookie')

    const register = async ({ setErrors, ...props }: RegisterProps) => {
        await csrf()

        setErrors([])

        axios
            .post('/register', props)
            .then(() => mutate())
            .catch(error => {
                if (error.response?.status !== 422) throw error

                setErrors(error.response.data.errors)
            })
    }

    const login = async ({ setErrors, setStatus, ...props }: LoginProps) => {
        await csrf()

        setErrors([])
        setStatus(null)

        axios
            .post('/login', props)
            .then(() => mutate())
            .catch(error => {
                if (error.response?.status !== 422) throw error

                setErrors(error.response.data.errors)
            })
    }

    const forgotPassword = async ({ setErrors, setStatus, email }: ForgotPasswordProps) => {
        await csrf()

        setErrors([])
        setStatus(null)

        axios
            .post('/forgot-password', { email })
            .then(response => setStatus(response.data.status))
            .catch(error => {
                if (error.response?.status !== 422) throw error

                setErrors(error.response.data.errors)
            })
    }

    const resetPassword = async ({ setErrors, setStatus, ...props }: ResetPasswordProps) => {
        await csrf()

        setErrors([])
        setStatus(null)

        axios
            .post('/reset-password', { token: params.token, ...props })
            .then(response =>
                router.push('/login?reset=' + btoa(response.data.status)),
            )
            .catch(error => {
                if (error.response?.status !== 422) throw error

                setErrors(error.response.data.errors)
            })
    }

    const resendEmailVerification = ({ setStatus }: { setStatus: React.Dispatch<React.SetStateAction<string | null>> }) => {
        axios
            .post('/email/verification-notification')
            .then(response => setStatus(response.data.status))
    }

    const logout = async () => {
        if (!error) {
            await axios.post('/logout').then(() => mutate())
        }

        window.location.pathname = '/login'
    }

    useEffect(() => {
        if (middleware === 'guest' && redirectIfAuthenticated && user)
            router.push(redirectIfAuthenticated)

        if (
            window.location.pathname === '/verify-email' &&
            user?.email_verified_at
        )
            router.push(redirectIfAuthenticated)

        if (middleware === 'auth' && error) logout()
    }, [user, error])

    return {
        user,
        register,
        login,
        forgotPassword,
        resetPassword,
        resendEmailVerification,
        logout,
    }
}
