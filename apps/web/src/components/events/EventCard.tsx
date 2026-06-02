'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Heart } from 'lucide-react'
import { useState } from 'react'

interface EventCardProps {
  id: string
  title: string
  image: string
  date: string
  location: string
  attendees: number
  price: number
  category?: string
  isSoldOut?: boolean
}

export function EventCard({ 
  id, 
  title, 
  image, 
  date, 
  location, 
  attendees, 
  price,
  category = "EVENT",
  isSoldOut = false
}: EventCardProps) {
  const [isSaved, setIsSaved] = useState(false)

  return (
    <Link href={`/events/${id}`}>
      <div style={{
        background: "#161616",
        borderRadius: "8px",
        overflow: "hidden",
        border: "1px solid #222222",
        transition: "all 0.3s",
        cursor: "pointer",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = "#39ff14";
        el.style.boxShadow = "0 0 20px rgba(57, 255, 20, 0.25)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = "#222222";
        el.style.boxShadow = "none";
      }}>
        {/* Image Container */}
        <div style={{
          position: "relative",
          height: "180px",
          background: "#111111",
          overflow: "hidden",
          group: "hover",
        }}>
          <Image
            src={image || '/placeholder-event.jpg'}
            alt={title}
            fill
            className="object-cover"
            style={{
              transition: "transform 0.3s",
            }}
            onMouseEnter={(e) => {
              const img = e.currentTarget as HTMLImageElement;
              img.style.transform = "scale(1.08)";
            }}
            onMouseLeave={(e) => {
              const img = e.currentTarget as HTMLImageElement;
              img.style.transform = "scale(1)";
            }}
          />

          {/* Status Badge */}
          <div style={{
            position: "absolute",
            top: "8px",
            left: "8px",
            background: "transparent",
            border: "1px solid #39ff14",
            color: "#39ff14",
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "10px",
            fontWeight: "bold",
            textTransform: "uppercase",
            fontFamily: "'Share Tech Mono', monospace",
            letterSpacing: "0.05em",
          }}>
            [ {category} ]
          </div>

          {/* Save Button */}
          <button
            onClick={(e) => {
              e.preventDefault()
              setIsSaved(!isSaved)
            }}
            style={{
              position: "absolute",
              top: "8px",
              right: "8px",
              padding: "8px",
              background: "#080808",
              borderRadius: "50%",
              border: "1px solid #222222",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              const btn = e.currentTarget as HTMLButtonElement;
              btn.style.borderColor = "#39ff14";
              btn.style.boxShadow = "0 0 10px rgba(57, 255, 20, 0.2)";
            }}
            onMouseLeave={(e) => {
              const btn = e.currentTarget as HTMLButtonElement;
              btn.style.borderColor = "#222222";
              btn.style.boxShadow = "none";
            }}
          >
            <Heart
              className="w-5 h-5"
              style={{
                color: isSaved ? "#ff3c3c" : "#888888",
                fill: isSaved ? "#ff3c3c" : "none",
                transition: "all 0.2s",
              }}
            />
          </button>

          {/* Sold Out Overlay */}
          {isSoldOut && (
            <div style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0, 0, 0, 0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <div style={{
                border: "2px solid #ff3c3c",
                color: "#ff3c3c",
                padding: "8px 16px",
                borderRadius: "4px",
                fontSize: "12px",
                fontWeight: "bold",
                textTransform: "uppercase",
                fontFamily: "'Share Tech Mono', monospace",
                letterSpacing: "0.05em",
              }}>
                [ SOLD OUT ]
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          flex: 1,
          justifyContent: "space-between",
        }}>
          {/* Title */}
          <h3 style={{
            fontWeight: "bold",
            color: "#e8e8e8",
            marginBottom: "12px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            fontSize: "14px",
            fontFamily: "'Share Tech Mono', monospace",
            lineHeight: "1.3",
          }}>
            {title}
          </h3>

          {/* Meta Info */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            marginBottom: "16px",
            fontSize: "12px",
            color: "#888888",
            fontFamily: "'Share Tech Mono', monospace",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span>📅</span>
              <span>{date}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span>📍</span>
              <span>{location}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span>👥</span>
              <span>{attendees.toLocaleString()} attending</span>
            </div>
          </div>

          {/* Price */}
          <div style={{
            paddingTop: "12px",
            borderTop: "1px solid #222222",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <span style={{
              fontWeight: "bold",
              fontSize: "16px",
              color: "#39ff14",
              fontFamily: "'Share Tech Mono', monospace",
            }}>
              €{price.toFixed(2)}
            </span>
            <span style={{
              fontSize: "11px",
              color: "#39ff14",
              border: "1px solid #39ff14",
              padding: "4px 8px",
              borderRadius: "4px",
              textTransform: "uppercase",
              fontFamily: "'Share Tech Mono', monospace",
              letterSpacing: "0.05em",
              fontWeight: "bold",
            }}>
              [ AVAILABLE ]
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
