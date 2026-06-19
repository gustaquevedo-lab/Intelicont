"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
  ChevronRight,
  ChevronDown,
  Search,
  Hash,
  DollarSign,
  FileText,
  Lock,
  Eye,
  AlertCircle,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChartAccount, AccountNature } from "@/lib/chart-of-accounts";
import { getNatureColor, getNatureBg, getNatureLabel, formatBalance } from "@/lib/chart-of-accounts";

interface AccountTreeProps {
  accounts: ChartAccount[];
  selectedCode: string | null;
  onSelect: (code: string) => void;
  searchTerm: string;
  natureFilter: string;
}

export function AccountTree({ accounts, selectedCode, onSelect, searchTerm, natureFilter }: AccountTreeProps) {
  const expandedCodes = useMemo(() => {
    const expanded = new Set<string>();
    function expandMatching(accs: ChartAccount[]) {
      for (const a of accs) {
        if (a.children && a.children.length > 0) {
          const hasMatch = searchTerm && (
            a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.code.includes(searchTerm)
          );
          if (hasMatch) {
            expanded.add(a.code);
            expandMatching(a.children);
          } else {
            expandMatching(a.children);
          }
        }
      }
    }
    expandMatching(accounts);
    return expanded;
  }, [accounts, searchTerm]);

  return (
    <div className="divide-y divide-gray-100 dark:divide-gray-800/50">
      {accounts.map((account) => (
        <AccountTreeNode
          key={account.code}
          account={account}
          depth={0}
          selectedCode={selectedCode}
          onSelect={onSelect}
          expandedCodes={expandedCodes}
          searchTerm={searchTerm}
          natureFilter={natureFilter}
        />
      ))}
    </div>
  );
}

interface AccountTreeNodeProps {
  account: ChartAccount;
  depth: number;
  selectedCode: string | null;
  onSelect: (code: string) => void;
  expandedCodes: Set<string>;
  searchTerm: string;
  natureFilter: string;
}

function AccountTreeNode({ account, depth, selectedCode, onSelect, expandedCodes, searchTerm, natureFilter }: AccountTreeNodeProps) {
  const hasChildren = account.children && account.children.length > 0;
  const isExpanded = expandedCodes.has(account.code);
  const isSelected = selectedCode === account.code;
  const isGroup = !account.allowsPosting;

  const matchesSearch = !searchTerm ||
    account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.code.includes(searchTerm);

  const matchesNature = natureFilter === "all" || account.nature === natureFilter;

  if (!matchesSearch && !matchesNature && (!account.children || !hasChildMatch(account, searchTerm, natureFilter))) {
    return null;
  }

  function hasChildMatch(acc: ChartAccount, search: string, nature: string): boolean {
    if (!acc.children) return false;
    return acc.children.some((c) => {
      const mSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.code.includes(search);
      const mNature = nature === "all" || c.nature === nature;
      return (mSearch && mNature) || hasChildMatch(c, search, nature);
    });
  }

  const paddingLeft = depth * 20 + 12;

  return (
    <div>
      <button
        onClick={() => {
          if (hasChildren || isGroup) {
            onSelect(account.code);
          } else {
            onSelect(account.code);
          }
        }}
        className={cn(
          "w-full flex items-center gap-2 py-2 pr-3 text-left transition-all hover:bg-gray-50 dark:hover:bg-gray-800/30 no-tap-highlight",
          isSelected && "bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-50 dark:hover:bg-blue-500/10",
          !matchesSearch && searchTerm ? "opacity-50" : ""
        )}
        style={{ paddingLeft: `${paddingLeft}px` }}
      >
        {/* Expand/Collapse */}
        <div className="w-5 h-5 flex items-center justify-center shrink-0">
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
            )
          ) : (
            <div className="h-3.5 w-3.5 rounded-sm bg-gray-200 dark:bg-gray-700" />
          )}
        </div>

        {/* Code */}
        <span className={cn(
          "font-mono text-xs shrink-0 tabular-nums",
          isSelected ? "text-blue-600 dark:text-blue-400 font-medium" : "text-gray-500 dark:text-gray-400"
        )}>
          {account.code}
        </span>

        {/* Name */}
        <span className={cn(
          "text-xs flex-1 truncate min-w-0",
          isGroup
            ? cn("font-medium", isSelected ? "text-blue-700 dark:text-blue-300" : "text-gray-900 dark:text-gray-200")
            : cn("text-gray-700 dark:text-gray-300")
        )}>
          {account.name}
        </span>

        {/* Nature Badge */}
        <span className={cn(
          "hidden sm:inline-flex text-[9px] px-1.5 py-0.5 rounded border shrink-0 font-medium",
          getNatureBg(account.nature),
          getNatureColor(account.nature)
        )}>
          {getNatureLabel(account.nature).slice(0, 3)}
        </span>

        {/* Balance */}
        {account.balance > 0 && (
          <span className={cn(
            "hidden sm:block font-mono text-xs shrink-0 tabular-nums ml-2",
            isSelected ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-400"
          )}>
            {formatBalance(account.balance, account.currency)}
          </span>
        )}

        {/* Lock icon for group accounts */}
        {isGroup && (
          <Lock className="h-3 w-3 shrink-0 text-gray-300 dark:text-gray-600" />
        )}
      </button>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="relative">
          {/* Vertical connector line */}
          <div
            className="absolute border-l border-gray-200 dark:border-gray-700"
            style={{ left: `${paddingLeft + 10}px`, top: 0, bottom: 12 }}
          />
          {account.children!.map((child) => (
            <AccountTreeNode
              key={child.code}
              account={child}
              depth={depth + 1}
              selectedCode={selectedCode}
              onSelect={onSelect}
              expandedCodes={expandedCodes}
              searchTerm={searchTerm}
              natureFilter={natureFilter}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface AccountDetailProps {
  account: ChartAccount;
  onClose: () => void;
  onEdit: (code: string) => void;
}

export function AccountDetail({ account, onClose, onEdit }: AccountDetailProps) {
  const isGroup = !account.allowsPosting;

  const mockTransactions = useMemo(() => {
    type Tx = { date: string; desc: string; debit: number; credit: number; entry: string };
    const descriptions: Record<string, Tx[]> = {
      "1.1.01.001": [
        { date: "2026-05-01", desc: "Apertura de caja", debit: 5000000, credit: 0, entry: "JE-001" },
        { date: "2026-05-02", desc: "Venta de contado", debit: 345600, credit: 0, entry: "JE-003" },
        { date: "2026-05-03", desc: "Pago viáticos", debit: 0, credit: 2100000, entry: "JE-007" },
      ],
    };
    return descriptions[account.code] || [
      { date: "2026-05-01", desc: "Asiento de apertura", debit: account.balance > 0 ? account.balance : 0, credit: account.balance < 0 ? Math.abs(account.balance) : 0, entry: "JE-000" },
    ];
  }, [account.code, account.balance]);

  return (
    <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Hash className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              <span className="font-mono text-sm text-blue-600 dark:text-blue-400 font-medium">{account.code}</span>
            </div>
            <h3 className="text-gray-900 dark:text-white text-sm font-semibold truncate">{account.name}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors no-tap-highlight shrink-0"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 sm:p-4 space-y-3">
        {/* Meta */}
        <div className="grid grid-cols-2 gap-2">
          <MetaItem label="Naturaleza" value={getNatureLabel(account.nature)} />
          <MetaItem label="Tipo" value={isGroup ? "Cuenta Grupo" : "Cuenta Analítica"} />
          <MetaItem label="Moneda" value={account.currency} />
          <MetaItem label="Estado" value={account.active ? "Activa" : "Inactiva"} />
        </div>

        {/* Balance Card */}
        <div className={cn(
          "rounded-lg p-3 border",
          getNatureBg(account.nature)
        )}>
          <div className="flex items-center justify-between mb-1">
            <span className={cn("text-[10px] uppercase tracking-wide font-medium", getNatureColor(account.nature))}>
              Saldo Actual
            </span>
            <DollarSign className={cn("h-4 w-4", getNatureColor(account.nature))} />
          </div>
          <p className={cn("font-mono text-xl font-bold", getNatureColor(account.nature))}>
            {formatBalance(account.balance, account.currency)}
          </p>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
            {account.currency === "USD" ? "Tipo de cambio: ₲ 7.350/USD" : "Moneda local"}
          </p>
        </div>

        {/* Tax Mappings */}
        {account.taxMappings && account.taxMappings.length > 0 && (
          <div>
            <h4 className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500 font-medium mb-2">Mapeo Fiscal</h4>
            <div className="flex flex-wrap gap-1.5">
              {account.taxMappings.map((t) => (
                <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Children summary for group accounts */}
        {isGroup && account.children && account.children.length > 0 && (
          <div>
            <h4 className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500 font-medium mb-2">
              Cuentas Hijas ({account.children.length})
            </h4>
            <div className="space-y-1">
              {account.children.slice(0, 5).map((child) => (
                <div key={child.code} className="flex items-center justify-between text-xs py-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-mono text-[10px] text-gray-400 shrink-0">{child.code}</span>
                    <span className="text-gray-700 dark:text-gray-300 truncate">{child.name}</span>
                  </div>
                  <span className="font-mono text-[10px] text-gray-500 dark:text-gray-400 shrink-0 ml-2 tabular-nums">
                    {formatBalance(child.balance, child.currency)}
                  </span>
                </div>
              ))}
              {account.children.length > 5 && (
                <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center pt-1">
                  +{account.children.length - 5} más
                </p>
              )}
            </div>
          </div>
        )}

        {/* Transactions for posting accounts */}
        {!isGroup && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500 font-medium">
                Movimientos Recientes
              </h4>
              <button className="text-[10px] text-blue-500 dark:text-blue-400 hover:underline flex items-center gap-1 no-tap-highlight">
                <Eye className="h-3 w-3" /> Ver todos
              </button>
            </div>
            <div className="space-y-1.5">
              {mockTransactions.map((tx, i) => (
                <div key={i} className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-2 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-400 text-[10px]">{tx.date}</span>
                    <span className="font-mono text-[10px] text-gray-400">{tx.entry}</span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 truncate mb-1">{tx.desc}</p>
                  <div className="flex items-center gap-2 text-[10px] font-mono">
                    {tx.debit > 0 && <span className="text-emerald-600 dark:text-emerald-400">D {tx.debit.toLocaleString("es-PY")}</span>}
                    {tx.credit > 0 && <span className="text-red-600 dark:text-red-400">C {tx.credit.toLocaleString("es-PY")}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="border-t border-gray-200 dark:border-gray-800 pt-3 flex gap-2">
          <button
            onClick={() => onEdit(account.code)}
            className="flex-1 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors border border-gray-200 dark:border-gray-700 no-tap-highlight"
          >
            {isGroup ? "Editar Grupo" : "Editar Cuenta"}
          </button>
          {!isGroup && (
            <button className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded-lg transition-colors border border-blue-200 dark:border-blue-500/20 no-tap-highlight">
              <FileText className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Nuevo Asiento</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-gray-400 text-[10px]">{label}</span>
      <p className="text-gray-700 dark:text-gray-300 text-xs truncate">{value}</p>
    </div>
  );
}
