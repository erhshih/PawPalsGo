package com.pawpals.backend.safety;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReportRepository extends JpaRepository<Report, String> {

  List<Report> findByReporter_IdOrderByCreatedAtDesc(String reporterId);
}
