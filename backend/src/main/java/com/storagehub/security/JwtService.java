package com.storagehub.security;

import com.storagehub.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;

@Service
public class JwtService {

    private final SecretKey signingKey;
    private final Duration ttl;

    public JwtService(
            @Value("${security.jwt.secret}")
            String base64Secret,

            @Value("${security.jwt.ttl:PT24H}")
            Duration ttl
    ) {
        this.signingKey = Keys.hmacShaKeyFor(
                Decoders.BASE64.decode(base64Secret)
        );

        this.ttl = ttl;
    }

    public TokenResult generateToken(User user) {
        Instant issuedAt = Instant.now();
        Instant expiresAt = issuedAt.plus(ttl);

        String token = Jwts.builder()
                .subject(user.getEmail())
                .claim("userId", user.getUserId())
                .claim(
                        "role",
                        user.getRole().getName().name()
                )
                .issuedAt(Date.from(issuedAt))
                .expiration(Date.from(expiresAt))
                .signWith(signingKey)
                .compact();

        return new TokenResult(token, expiresAt);
    }

    public Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public record TokenResult(
            String token,
            Instant expiresAt
    ) {
    }
}