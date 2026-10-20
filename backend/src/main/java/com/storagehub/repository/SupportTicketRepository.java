package com.storagehub.repository;

import com.storagehub.entity.SupportTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SupportTicketRepository extends JpaRepository<SupportTicket, Long> {

    @Query("SELECT st FROM SupportTicket st JOIN FETCH st.unit JOIN FETCH st.customer WHERE st.code = :code")
    Optional<SupportTicket> findByCode(@Param("code") String code);

    @Query("SELECT st FROM SupportTicket st LEFT JOIN FETCH st.unit u LEFT JOIN FETCH st.customer c WHERE st.status IN :statuses ORDER BY st.createdAt DESC")
    java.util.List<SupportTicket> findByStatusInWithDetails(@Param("statuses") java.util.Collection<SupportTicket.Status> statuses);
}
