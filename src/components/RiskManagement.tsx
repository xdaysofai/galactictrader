import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ResourceType } from '@/types/galaxy';
import { soundManager, SoundType } from '@/utils/soundManager';
import styles from './RiskManagement.module.css';

interface RiskManagementProps {
  playerCredits: number;
  cargoCapacity: number;
  hasIllegalGoods: boolean;
  currentPlanet?: {
    name: string;
    distance: number;
    resources: {
      type: string;
      abundance: number;
    }[];
  };
  targetPlanet?: {
    name: string;
    distance: number;
    government: string;
    resources: {
      type: string;
      abundance: number;
    }[];
  };
  onClose: () => void;
}

interface RiskAssessment {
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  profitPotential: 'Low' | 'Medium' | 'High' | 'Excellent';
  pirateChance: number;
  authoritiesChance: number;
  marketVolatility: number;
  recommendation: string;
  riskFactors: {
    factor: string;
    impact: number;
  }[];
}

const RiskManagement: React.FC<RiskManagementProps> = ({
  playerCredits,
  cargoCapacity,
  hasIllegalGoods,
  currentPlanet,
  targetPlanet,
  onClose
}) => {
  const [assessment, setAssessment] = useState<RiskAssessment | null>(null);
  const [selectedResource, setSelectedResource] = useState<string>('metals');
  const [quantity, setQuantity] = useState<number>(10);

  useEffect(() => {
    if (currentPlanet && targetPlanet) {
      analyzeRisk();
    }
  }, [currentPlanet, targetPlanet, selectedResource, quantity, hasIllegalGoods]);

  // Add keyboard support for ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleClose = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log("Risk Management close button clicked");
    soundManager.playSound(SoundType.MENU_CLOSE);
    onClose();
  };

  const analyzeRisk = () => {
    if (!currentPlanet || !targetPlanet) return;

    // Distance factor - longer routes are riskier
    const distanceFactor = Math.min(targetPlanet.distance / 10, 1);
    
    // Resource factors
    const sourceAbundance = currentPlanet.resources.find(r => 
      r.type.toLowerCase() === selectedResource.toLowerCase())?.abundance || 0;
    
    const targetAbundance = targetPlanet.resources.find(r => 
      r.type.toLowerCase() === selectedResource.toLowerCase())?.abundance || 0;
    
    // Higher abundance difference means better profit potential
    const abundanceDifference = Math.abs(targetAbundance - sourceAbundance);
    const profitFactor = Math.min(abundanceDifference / 30, 1);
    
    // Calculate risk factors
    const isContraband = selectedResource.toLowerCase() === 'contraband';
    
    // Base pirate chance increases with distance and cargo value
    const basePirateChance = 5 + (distanceFactor * 15) + (quantity * 0.1);
    const pirateRisk = Math.min(basePirateChance + (isContraband ? 20 : 0), 95);
    
    // Authority risk is mainly for contraband but also depends on government type
    let authorityRisk = isContraband ? 30 : 5;
    if (targetPlanet.government.includes('Corporate') || targetPlanet.government.includes('Oligarchy')) {
      authorityRisk *= 0.7; // More corruption, less scrutiny
    }
    if (targetPlanet.government.includes('Republic') || targetPlanet.government.includes('Coalition')) {
      authorityRisk *= 1.3; // More law enforcement
    }
    
    // Market volatility based on abundances and resource type
    const volatility = 10 + (100 - Math.max(sourceAbundance, targetAbundance));
    
    // Risk levels based on factors
    const overallRisk = calculateOverallRisk(pirateRisk, authorityRisk, volatility);
    const profitAssessment = calculateProfitPotential(abundanceDifference, quantity, selectedResource);
    
    const riskFactors = [
      { factor: 'Distance', impact: Math.round(distanceFactor * 100) },
      { factor: isContraband ? 'Contraband Cargo' : 'Legal Cargo', impact: isContraband ? 85 : 15 },
      { factor: 'Route Security', impact: Math.round(pirateRisk) },
      { factor: 'Local Authorities', impact: Math.round(authorityRisk) },
      { factor: 'Market Stability', impact: Math.round(Math.min(volatility, 100)) }
    ];
    
    const recommendation = generateRecommendation(
      overallRisk, 
      profitAssessment, 
      isContraband, 
      quantity, 
      cargoCapacity
    );
    
    setAssessment({
      riskLevel: overallRisk,
      profitPotential: profitAssessment,
      pirateChance: Math.round(pirateRisk),
      authoritiesChance: Math.round(authorityRisk),
      marketVolatility: Math.round(Math.min(volatility, 100)),
      recommendation,
      riskFactors
    });
  };
  
  const calculateOverallRisk = (
    pirateRisk: number, 
    authorityRisk: number, 
    volatility: number
  ): RiskAssessment['riskLevel'] => {
    const combinedRisk = (pirateRisk * 0.5) + (authorityRisk * 0.3) + (volatility * 0.2);
    
    if (combinedRisk > 75) return 'Critical';
    if (combinedRisk > 50) return 'High';
    if (combinedRisk > 25) return 'Medium';
    return 'Low';
  };
  
  const calculateProfitPotential = (
    abundanceDifference: number, 
    quantity: number,
    resourceType: string
  ): RiskAssessment['profitPotential'] => {
    let baseValue = 0;
    
    switch (resourceType.toLowerCase()) {
      case 'metals': baseValue = 100; break;
      case 'water': baseValue = 50; break;
      case 'food': baseValue = 75; break;
      case 'technology': baseValue = 250; break;
      case 'luxurygoods': baseValue = 500; break;
      case 'contraband': baseValue = 800; break;
      default: baseValue = 100;
    }
    
    const potentialProfit = (baseValue * quantity * abundanceDifference) / 100;
    const profitPercentage = (potentialProfit / playerCredits) * 100;
    
    if (profitPercentage > 30) return 'Excellent';
    if (profitPercentage > 20) return 'High';
    if (profitPercentage > 10) return 'Medium';
    return 'Low';
  };
  
  const generateRecommendation = (
    risk: RiskAssessment['riskLevel'],
    profit: RiskAssessment['profitPotential'],
    isContraband: boolean,
    quantity: number,
    capacity: number
  ): string => {
    if (risk === 'Critical' && profit !== 'Excellent') {
      return "Extremely hazardous route. Not recommended unless desperate for credits.";
    }
    
    if (risk === 'Critical' && profit === 'Excellent') {
      return "High-risk, high-reward opportunity. Consider smaller cargo or escort.";
    }
    
    if (risk === 'High' && (profit === 'Low' || profit === 'Medium')) {
      return "Risk outweighs potential profits. Consider alternative route or cargo.";
    }
    
    if (isContraband) {
      return "Consider legal alternatives unless profit margins justify the legal risk.";
    }
    
    if (quantity > capacity * 0.8) {
      return "Consider reducing cargo size to increase maneuverability in case of hostile encounters.";
    }
    
    if (profit === 'Excellent' && risk !== 'Critical') {
      return "Excellent profit opportunity with manageable risk. Proceed with caution.";
    }
    
    if (profit === 'Low' && risk !== 'Low') {
      return "Minimal profits for the risk involved. Consider alternative trade routes.";
    }
    
    return "Standard trade route with balanced risk-reward profile. Proceed normally.";
  };
  
  const getRiskColor = (risk: RiskAssessment['riskLevel']): string => {
    switch (risk) {
      case 'Low': return '#4CAF50';
      case 'Medium': return '#FFC107';
      case 'High': return '#FF9800';
      case 'Critical': return '#F44336';
      default: return '#AAAAAA';
    }
  };
  
  const getProfitColor = (profit: RiskAssessment['profitPotential']): string => {
    switch (profit) {
      case 'Excellent': return '#4CAF50';
      case 'High': return '#8BC34A';
      case 'Medium': return '#FFC107';
      case 'Low': return '#FF9800';
      default: return '#AAAAAA';
    }
  };

  return (
    <motion.div
      className={styles.modalOverlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => {
        // Close only if clicking directly on the overlay
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
      style={{ zIndex: 150 }}
    >
      <motion.div 
        className={styles.riskManagement}
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h2>Risk Management Module</h2>
          <button 
            onClick={handleClose} 
            className={styles.closeButton}
            aria-label="Close risk management"
          >
            ×
          </button>
        </div>

        {/* Mobile close button */}
        <button
          onClick={handleClose}
          className={styles.mobileCloseButton}
          aria-label="Close"
        >
          ×
        </button>
        
        <div className={styles.routeSelection}>
          <div className={styles.planetInfo}>
            <h3>Route Analysis</h3>
            {currentPlanet && targetPlanet ? (
              <div className={styles.route}>
                <div className={styles.planet}>{currentPlanet.name}</div>
                <div className={styles.arrow}>→</div>
                <div className={styles.planet}>{targetPlanet.name}</div>
                <div className={styles.distance}>{targetPlanet.distance.toFixed(1)} LY</div>
              </div>
            ) : (
              <div className={styles.noRoute}>No route selected</div>
            )}
          </div>
          
          <div className={styles.cargoSelection}>
            <div className={styles.formGroup}>
              <label>Cargo Type:</label>
              <select 
                value={selectedResource}
                onChange={(e) => setSelectedResource(e.target.value)}
                className={styles.select}
              >
                <option value="metals">Metals</option>
                <option value="water">Water</option>
                <option value="food">Food</option>
                <option value="technology">Technology</option>
                <option value="luxuryGoods">Luxury Goods</option>
                <option value="contraband">Contraband</option>
              </select>
            </div>
            
            <div className={styles.formGroup}>
              <label>Quantity:</label>
              <input
                type="number"
                min="1"
                max={cargoCapacity}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className={styles.input}
              />
            </div>
          </div>
        </div>
        
        {assessment && (
          <div className={styles.assessmentResults}>
            <div className={styles.summaryRow}>
              <div className={styles.summaryBox}>
                <div className={styles.summaryLabel}>Risk Level</div>
                <div 
                  className={styles.summaryValue}
                  style={{ color: getRiskColor(assessment.riskLevel) }}
                >
                  {assessment.riskLevel}
                </div>
              </div>
              
              <div className={styles.summaryBox}>
                <div className={styles.summaryLabel}>Profit Potential</div>
                <div 
                  className={styles.summaryValue}
                  style={{ color: getProfitColor(assessment.profitPotential) }}
                >
                  {assessment.profitPotential}
                </div>
              </div>
            </div>
            
            <div className={styles.detailsSection}>
              <h4 className={styles.sectionTitle}>Risk Factors</h4>
              <div className={styles.riskFactors}>
                {assessment.riskFactors.map((factor, index) => (
                  <div key={index} className={styles.riskFactor}>
                    <div className={styles.factorName}>{factor.factor}</div>
                    <div className={styles.factorBarContainer}>
                      <div 
                        className={styles.factorBar} 
                        style={{ 
                          width: `${factor.impact}%`,
                          backgroundColor: factor.impact > 70 ? '#F44336' : 
                                           factor.impact > 40 ? '#FF9800' : 
                                           factor.impact > 20 ? '#FFC107' : 
                                           '#4CAF50'
                        }}
                      />
                    </div>
                    <div className={styles.factorValue}>{factor.impact}%</div>
                  </div>
                ))}
              </div>
              
              <div className={styles.probabilitySection}>
                <div className={styles.probability}>
                  <span className={styles.probLabel}>Pirate Encounter:</span>
                  <span className={styles.probValue}>{assessment.pirateChance}%</span>
                </div>
                <div className={styles.probability}>
                  <span className={styles.probLabel}>Authority Inspection:</span>
                  <span className={styles.probValue}>{assessment.authoritiesChance}%</span>
                </div>
                <div className={styles.probability}>
                  <span className={styles.probLabel}>Market Volatility:</span>
                  <span className={styles.probValue}>{assessment.marketVolatility}%</span>
                </div>
              </div>
              
              <div className={styles.recommendation}>
                <h4>Recommendation</h4>
                <p>{assessment.recommendation}</p>
              </div>
            </div>
          </div>
        )}
        
        <div className={styles.actions}>
          <button className={styles.analyzeButton} onClick={analyzeRisk}>
            Analyze Risk
          </button>
          <button className={styles.closeButton} onClick={handleClose}>
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default RiskManagement; 