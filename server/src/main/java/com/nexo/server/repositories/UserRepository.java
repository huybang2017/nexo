package com.nexo.server.repositories;

import com.nexo.server.entities.User;
import com.nexo.server.enums.UserRole;
import com.nexo.server.enums.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Optional<User> findByUuid(String uuid);

    boolean existsByEmail(String email);

    Optional<User> findByOauthProviderAndOauthId(String provider, String oauthId);

    Page<User> findByRole(UserRole role, Pageable pageable);

    Page<User> findByStatus(UserStatus status, Pageable pageable);

    Page<User> findByRoleAndStatus(UserRole role, UserStatus status, Pageable pageable);

    @Query("SELECT u FROM User u WHERE " +
           "(:search IS NULL OR :search = '' OR LOWER(u.email) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) " +
           "OR LOWER(u.firstName) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) " +
           "OR LOWER(u.lastName) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))) " +
           "AND (:role IS NULL OR u.role = :role) " +
           "AND (:status IS NULL OR u.status = :status)")
    Page<User> searchUsers(
            @Param("search") String search,
            @Param("role") UserRole role,
            @Param("status") UserStatus status,
            Pageable pageable);

    @Query("SELECT COUNT(u) FROM User u WHERE u.role = :role")
    long countByRole(@Param("role") UserRole role);

    @Query("SELECT COUNT(u) FROM User u WHERE u.status = :status")
    long countByStatus(@Param("status") UserStatus status);
}

