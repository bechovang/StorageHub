package com.storagehub.security;

import com.storagehub.entity.User;
import com.storagehub.repository.UserRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthenticationFilter
        extends OncePerRequestFilter {

    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtService jwtService;
    private final UserRepository userRepository;

    public JwtAuthenticationFilter(
            JwtService jwtService,
            UserRepository userRepository
    ) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String header = request.getHeader("Authorization");

        if (header == null ||
                !header.startsWith(BEARER_PREFIX)) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = header.substring(
                BEARER_PREFIX.length()
        );

        try {
            Claims claims = jwtService.parseClaims(token);
            String email = claims.getSubject();

            User user = userRepository
                    .findByEmailIgnoreCase(email)
                    .orElse(null);

            if (user != null &&
                    user.isActive() &&
                    SecurityContextHolder
                            .getContext()
                            .getAuthentication() == null) {

                String authority =
                        "ROLE_" +
                                user.getRole().getName().name();

                var authentication =
                        new UsernamePasswordAuthenticationToken(
                                user.getEmail(),
                                null,
                                List.of(
                                        new SimpleGrantedAuthority(
                                                authority
                                        )
                                )
                        );

                SecurityContext context =
                        SecurityContextHolder
                                .createEmptyContext();

                context.setAuthentication(authentication);
                SecurityContextHolder.setContext(context);
            }

        } catch (JwtException | IllegalArgumentException exception) {
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }
}