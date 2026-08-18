import { render, screen } from '@testing-library/react'
import TravelAnimationPage from './page'

jest.mock('next/dynamic', () => (factory: any) => {
  const resolved = factory()
  return resolved.default || resolved
})

jest.mock('@/app/components/layout/Navbar', () => {
  const MockNavbar = () => <div>Navbar</div>
  MockNavbar.displayName = 'MockNavbar'
  return MockNavbar
})

jest.mock('@/lib/api', () => ({
  auth: {
    getUser: jest.fn(() => ({ id: 'u1', role: 'super_user' })),
  },
  api: {
    getEvents: jest.fn(async () => []),
    getCharacters: jest.fn(async () => []),
  },
}))

jest.mock('@/app/lib/i18n', () => ({
  t: (key: string) => key,
}))

describe('TravelAnimationPage', () => {
  it('renders page title', async () => {
    render(<TravelAnimationPage />)
    expect(await screen.findByText('Character Travel Animation')).toBeInTheDocument()
  })
})
