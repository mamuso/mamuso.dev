import Link from 'next/link'

export default function Header() {
  return (
    <nav id="header">
      <h1>
        <Link href="/">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13.3129 16.4133C13.3205 16.4158 13.3282 16.4184 13.3358 16.421C16.6716 17.5381 19.8828 17.6538 19.8828 17.6538C19.8828 17.6538 20.639 10.7152 18.3097 6.28111C15.9804 1.84699 10.7493 0.0472412 10.7493 0.0472412C10.7493 0.0472412 -0.158337 3.28232 0.00174495 9.44839C0.161827 15.6145 4.29759 18.6275 4.29759 18.6275C4.29759 18.6275 5.30616 17.6538 6.69882 16.3505C6.72136 16.3294 6.74375 16.3084 6.76599 16.2876C6.86587 16.3996 6.96805 16.5083 7.07252 16.6129C9.2243 18.7678 11.7916 19.6675 11.7916 19.6675L13.3129 16.4133Z" />
          </svg>
          <span>mamuso</span>
        </Link>
      </h1>
      <ul>
        <li>
          <Link href="/posts/">posts</Link>
        </li>
        <li>
          <Link href="/photos/">photos</Link>
        </li>
      </ul>
    </nav>
  )
}
